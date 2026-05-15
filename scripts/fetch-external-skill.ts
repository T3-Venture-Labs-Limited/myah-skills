import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { load as parseYaml } from 'js-yaml';

const EXTERNAL_DIR_NAME = 'external';
const SKILL_YAML_NAME = 'skill.yaml';
const SKILL_MD_NAME = 'SKILL.md';

const DETAIL_URL_PATTERN = /^https:\/\/skills\.sh\/([^/]+)\/([^/]+)\/([^/]+)$/;

const PATH_LAYOUTS: Array<(slug: string) => string> = [
	(slug) => `skills/${slug}/SKILL.md`,
	(slug) => `dist/skills/${slug}/SKILL.md`,
	(slug) => `${slug}/SKILL.md`,
	(slug) => `packages/${slug}/SKILL.md`,
	(slug) => `.agents/skills/${slug}/SKILL.md`,
	(slug) => `.claude/skills/${slug}/SKILL.md`,
	(slug) => `.cursor/skills/${slug}/SKILL.md`,
	(_slug) => `SKILL.md`
];

const BRANCHES = ['main', 'master'] as const;

export interface DerivedSource {
	author: string;
	repo: string;
	slug: string;
}

export interface FetchSuccess {
	url: string;
	body: string;
}

export interface FetchResult {
	slug: string;
	source: DerivedSource | null;
	success: FetchSuccess | null;
	attempts: string[];
	error?: string;
}

export interface RunOptions {
	all: boolean;
	slug: string | null;
	rootDir: string;
}

export interface RunSummary {
	succeeded: number;
	failed: number;
	results: FetchResult[];
}

interface SkillYaml {
	external_audit?: {
		detail_url?: string;
	};
}

export function parseDetailUrl(url: string): DerivedSource {
	const match = DETAIL_URL_PATTERN.exec(url.trim());
	if (!match) {
		throw new Error(`Invalid skills.sh detail_url: ${url}`);
	}

	return { author: match[1], repo: match[2], slug: match[3] };
}

export function buildCandidateUrls(source: DerivedSource): string[] {
	const urls: string[] = [];

	for (const branch of BRANCHES) {
		for (const layout of PATH_LAYOUTS) {
			urls.push(
				`https://raw.githubusercontent.com/${source.author}/${source.repo}/${branch}/${layout(source.slug)}`
			);
		}
	}

	return urls;
}

export async function fetchFirstSuccess(urls: string[]): Promise<FetchSuccess | null> {
	for (const url of urls) {
		try {
			const response = await fetch(url);

			if (response.ok) {
				const body = await response.text();
				return { url, body };
			}
		} catch {
			// Network error on this candidate — try the next URL.
			continue;
		}
	}

	return null;
}

export async function loadDetailUrl(yamlPath: string): Promise<string> {
	const raw = await readFile(yamlPath, 'utf8');
	const parsed = parseYaml(raw) as SkillYaml | undefined;
	const detailUrl = parsed?.external_audit?.detail_url;

	if (typeof detailUrl !== 'string' || detailUrl.length === 0) {
		throw new Error(`Missing external_audit.detail_url in ${yamlPath}`);
	}

	return detailUrl;
}

export async function listExternalSlugs(externalDir: string): Promise<string[]> {
	const entries = await readdir(externalDir, { withFileTypes: true });
	const slugs: string[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory()) {
			continue;
		}

		const yamlPath = path.join(externalDir, entry.name, SKILL_YAML_NAME);
		try {
			await stat(yamlPath);
			slugs.push(entry.name);
		} catch {
			continue;
		}
	}

	return slugs.sort((left, right) => left.localeCompare(right));
}

export async function fetchExternalSkill(externalDir: string, slug: string): Promise<FetchResult> {
	const yamlPath = path.join(externalDir, slug, SKILL_YAML_NAME);

	let detailUrl: string;
	try {
		detailUrl = await loadDetailUrl(yamlPath);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { slug, source: null, success: null, attempts: [], error: message };
	}

	let source: DerivedSource;
	try {
		source = parseDetailUrl(detailUrl);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { slug, source: null, success: null, attempts: [], error: message };
	}

	if (source.slug !== slug) {
		console.warn(
			`Slug mismatch for "${slug}": detail_url slug is "${source.slug}". Using directory name "${slug}" for the GitHub path.`
		);
	}

	const candidates = buildCandidateUrls({ ...source, slug });
	const success = await fetchFirstSuccess(candidates);

	if (success) {
		const targetPath = path.join(externalDir, slug, SKILL_MD_NAME);
		await writeFile(targetPath, success.body, 'utf8');
	}

	return { slug, source, success, attempts: candidates };
}

function resolveRootDir(): string {
	return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

export async function runFetcher(options: RunOptions): Promise<RunSummary> {
	const externalDir = path.join(options.rootDir, EXTERNAL_DIR_NAME);

	let slugs: string[];
	if (options.all) {
		slugs = await listExternalSlugs(externalDir);
	} else if (options.slug) {
		slugs = [options.slug];
	} else {
		throw new Error('Must specify --all or --slug <name>');
	}

	const results: FetchResult[] = [];
	for (const slug of slugs) {
		const result = await fetchExternalSkill(externalDir, slug);

		if (result.success) {
			console.log(`OK: ${slug} ← ${result.success.url}`);
		} else if (result.error) {
			console.error(`FAIL: ${slug} — ${result.error}`);
		} else {
			const author = result.source?.author ?? 'unknown';
			const repo = result.source?.repo ?? 'unknown';
			console.error(
				`FAIL: ${slug} (author=${author}, repo=${repo}) — tried ${result.attempts.length} URLs, all failed`
			);
			for (const url of result.attempts) {
				console.error(`  - ${url}`);
			}
		}

		results.push(result);
	}

	const succeeded = results.filter((entry) => entry.success !== null).length;
	const failed = results.length - succeeded;

	console.log(`\n${succeeded}/${results.length} succeeded, ${failed} failed`);

	return { succeeded, failed, results };
}

interface CliArgs {
	all: boolean;
	slug: string | null;
	rootDir: string | null;
}

function parseCliArgs(argv: string[]): CliArgs {
	const options: CliArgs = { all: false, slug: null, rootDir: null };

	for (let index = 0; index < argv.length; index += 1) {
		const value = argv[index];

		if (value === '--all') {
			options.all = true;
			continue;
		}

		if (value === '--slug') {
			options.slug = argv[index + 1] ?? null;
			index += 1;
			continue;
		}

		if (value === '--root') {
			options.rootDir = argv[index + 1] ?? null;
			index += 1;
			continue;
		}
	}

	return options;
}

async function main(): Promise<void> {
	try {
		const cliArgs = parseCliArgs(process.argv.slice(2));
		const rootDir = cliArgs.rootDir ?? resolveRootDir();

		const summary = await runFetcher({ all: cliArgs.all, slug: cliArgs.slug, rootDir });

		if (summary.failed > 0) {
			process.exitCode = 1;
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error: ${message}`);
		process.exitCode = 1;
	}
}

const isEntrypoint =
	typeof process.argv[1] === 'string' && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
	await main();
}
