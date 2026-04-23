export interface SecretFinding {
  rule: string;
  severity: 'fail';
  file: string;
  line: number;
  verified: boolean;
  raw?: string;
}

export interface SafetyFinding {
  rule: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  file: string;
  line: number;
  message: string;
  snippet?: string;
}

export interface DependencyFinding {
  package: string;
  installed_version: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  cve?: string;
  advisory_url?: string;
  fixed_in?: string;
}

export interface SecretsCheck {
  status: 'pass' | 'fail';
  findings_count: number;
  findings: SecretFinding[];
}

export interface SafetyCheck {
  status: 'pass' | 'warn' | 'fail';
  findings_count: number;
  findings: SafetyFinding[];
}

export interface DependenciesCheck {
  status: 'pass' | 'warn' | 'fail' | 'not_applicable';
  has_deps: boolean;
  vulnerabilities_count: number;
  findings: DependencyFinding[];
}

export interface SkillAuditResult {
  slug: string;
  scanned_at: string;
  commit_sha: string;
  run_url: string;
  overall: 'pass' | 'warn' | 'fail' | 'pending';
  secrets: SecretsCheck;
  safety: SafetyCheck;
  dependencies: DependenciesCheck;
}

export interface AuditSummary {
  generated_at: string;
  total_skills: number;
  overall_stats: {
    pass: number;
    warn: number;
    fail: number;
    pending: number;
  };
  per_check: {
    secrets: { pass: number; fail: number };
    safety: { pass: number; warn: number; fail: number };
    dependencies: { pass: number; warn: number; fail: number; not_applicable: number };
  };
}
