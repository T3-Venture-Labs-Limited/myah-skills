import { readdirSync, readFileSync, existsSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { SkillAuditResult, AuditSummary, SecretsCheck, SafetyCheck, DependenciesCheck } from './types';

const AUDIT_RAW_DIR = 'audit-results/_raw';
const AUDIT_RESULTS_DIR = 'audit-results';

function getCommitSha(): string {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function getRunUrl(): string {
  if (process.env.GITHUB_RUN_ID) {
    const server = process.env.GITHUB_SERVER_URL || 'https://github.com';
    const repo = process.env.GITHUB_REPOSITORY || '';
    return `${server}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  }
  return '';
}

function parseTruffleHogOutput(slug: string, rawPath: string): SecretsCheck {
  if (!existsSync(rawPath)) {
    return { status: 'pass', findings_count: 0, findings: [] };
  }

  const lines = readFileSync(rawPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    })
    .filter(Boolean);

  const findings = lines.map((finding: any) => ({
    rule: finding.DetectorName || 'unknown',
    severity: 'fail' as const,
    file: finding.SourceMetadata?.Data?.Filesystem?.file || finding.SourceMetadata?.Data?.Git?.file || '',
    line: finding.SourceMetadata?.Data?.Filesystem?.line || finding.SourceMetadata?.Data?.Git?.line || 0,
    verified: finding.Verified === true,
    raw: finding.Raw || undefined,
  }));

  return {
    status: findings.length > 0 ? 'fail' : 'pass',
    findings_count: findings.length,
    findings,
  };
}

function parseSemgrepOutput(slug: string, rawPath: string): SafetyCheck {
  if (!existsSync(rawPath)) {
    return { status: 'pass', findings_count: 0, findings: [] };
  }

  try {
    const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
    const results = raw.results || [];

    const findings = results.map((r: any) => ({
      rule: r.check_id || 'unknown',
      severity: (r.extra?.severity || 'WARNING').toUpperCase() as 'ERROR' | 'WARNING' | 'INFO',
      file: r.path || '',
      line: r.start?.line || 0,
      message: r.extra?.message || '',
      snippet: r.extra?.lines || undefined,
    }));

    const hasError = findings.some((f) => f.severity === 'ERROR');
    const hasWarn = findings.some((f) => f.severity === 'WARNING');

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    if (hasError) status = 'fail';
    else if (hasWarn) status = 'warn';

    return {
      status,
      findings_count: findings.length,
      findings,
    };
  } catch {
    console.warn(`Warning: Could not parse Semgrep output for ${slug}, treating as pass`);
    return { status: 'pass', findings_count: 0, findings: [] };
  }
}

function parseDependencyOutput(slug: string, rawPath: string): DependenciesCheck {
  if (!existsSync(rawPath)) {
    return { status: 'not_applicable', has_deps: false, vulnerabilities_count: 0, findings: [] };
  }

  try {
    const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
    const vulnCount = raw.vulnerabilities_count || 0;

    let status: 'pass' | 'warn' | 'fail' | 'not_applicable';
    if (!raw.has_deps) {
      status = 'not_applicable';
    } else if (vulnCount === 0) {
      status = 'pass';
    } else {
      status = 'warn'; // v1: deps never fail, only warn
    }

    return {
      status,
      has_deps: raw.has_deps || false,
      vulnerabilities_count: vulnCount,
      findings: raw.findings || [],
    };
  } catch {
    console.warn(`Warning: Could not parse dependency audit output for ${slug}, treating as not_applicable`);
    return { status: 'not_applicable', has_deps: false, vulnerabilities_count: 0, findings: [] };
  }
}

function computeOverall(secrets: SecretsCheck, safety: SafetyCheck, deps: DependenciesCheck): 'pass' | 'warn' | 'fail' | 'pending' {
  if (secrets.status === 'fail' || safety.status === 'fail') return 'fail';
  if (safety.status === 'warn' || deps.status === 'warn') return 'warn';
  if (secrets.status === 'pass' && safety.status === 'pass' && (deps.status === 'pass' || deps.status === 'not_applicable')) return 'pass';
  return 'pending';
}

function processSkill(slug: string): SkillAuditResult {
  const rawDir = join(AUDIT_RAW_DIR, slug);
  const secrets = parseTruffleHogOutput(slug, join(rawDir, 'secrets.json'));
  const safety = parseSemgrepOutput(slug, join(rawDir, 'safety.json'));
  const dependencies = parseDependencyOutput(slug, join(rawDir, 'deps.json'));

  return {
    slug,
    scanned_at: new Date().toISOString(),
    commit_sha: getCommitSha(),
    run_url: getRunUrl(),
    overall: computeOverall(secrets, safety, dependencies),
    secrets,
    safety,
    dependencies,
  };
}

function writeSkillResult(result: SkillAuditResult): void {
  const path = join(AUDIT_RESULTS_DIR, `${result.slug}.json`);
  writeFileSync(path, JSON.stringify(result, null, 2));
  console.log(`Wrote ${path} — overall: ${result.overall}`);
}

function writeSummary(results: SkillAuditResult[]): void {
  const stats = { pass: 0, warn: 0, fail: 0, pending: 0 };
  const perCheck = {
    secrets: { pass: 0, fail: 0 },
    safety: { pass: 0, warn: 0, fail: 0 },
    dependencies: { pass: 0, warn: 0, fail: 0, not_applicable: 0 },
  };

  for (const r of results) {
    stats[r.overall]++;
    perCheck.secrets[r.secrets.status === 'pass' ? 'pass' : 'fail']++;
    perCheck.safety[r.safety.status]++;
    perCheck.dependencies[r.dependencies.status]++;
  }

  const summary: AuditSummary = {
    generated_at: new Date().toISOString(),
    total_skills: results.length,
    overall_stats: stats,
    per_check: perCheck,
  };

  const path = join(AUDIT_RESULTS_DIR, '_summary.json');
  writeFileSync(path, JSON.stringify(summary, null, 2));
  console.log(`Wrote ${path} — total: ${results.length}, pass: ${stats.pass}, warn: ${stats.warn}, fail: ${stats.fail}`);
}

function main(): void {
  const args = process.argv.slice(2);
  const skillFlag = args.indexOf('--skill');
  const allFlag = args.includes('--all');

  if (!existsSync(AUDIT_RESULTS_DIR)) {
    mkdirSync(AUDIT_RESULTS_DIR, { recursive: true });
  }

  if (skillFlag !== -1 && args[skillFlag + 1]) {
    const slug = args[skillFlag + 1];
    const result = processSkill(slug);
    writeSkillResult(result);
  } else if (allFlag) {
    const slugs = readdirSync(AUDIT_RAW_DIR)
      .filter((d) => d !== '_summary.json' && existsSync(join(AUDIT_RAW_DIR, d)));

    const results = slugs.map(processSkill);
    for (const r of results) writeSkillResult(r);
    writeSummary(results);

    if (existsSync(AUDIT_RAW_DIR)) {
      rmSync(AUDIT_RAW_DIR, { recursive: true });
      console.log(`Cleaned up ${AUDIT_RAW_DIR}`);
    }
  } else {
    console.error('Usage: npx tsx scripts/audits/aggregate-results.ts --skill <slug> | --all');
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error('Aggregator crashed:', err instanceof Error ? err.stack || err.message : err);
  process.exit(1);
}
