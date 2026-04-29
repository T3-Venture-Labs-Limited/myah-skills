import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

import matter from 'gray-matter';
import { load as parseYaml } from 'js-yaml';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import type { BundleManifest, Catalog, CatalogEntry, ExternalAudit, SecurityAuditResult, SkillFrontmatter } from '../types/skill.js';
import { existsSync, readFileSync } from 'node:fs';

const execFileAsync = promisify(execFile);
const SKILL_FILE_NAME = 'SKILL.md';
const BUNDLE_FILE_NAME = 'bundle.yaml';
const CATALOG_VERSION = 1;
const DEFAULT_OUTPUT_FILE = 'catalog.json';
const VALID_IDENTIFIER = /^[a-z0-9_-]+$/;

type JsonObject = Record<string, unknown>;

export interface BuildCatalogOptions {
	rootDir?: string;
	outputPath?: string;
	commitSha?: string;
	generatedAt?: string;
}

interface CatalogMetadata {
	commitSha: string;
	generatedAt: string;
}

interface SkillDirectoryStats {
	files: string[];
	sizeBytes: number;
}

export async function buildCatalog(options: BuildCatalogOptions = {}): Promise<Catalog> {
	const rootDir = options.rootDir ?? resolveRootDir();
	const outputPath = options.outputPath ?? path.join(rootDir, DEFAULT_OUTPUT_FILE);
	const metadata = await resolveCatalogMetadata(rootDir, options);

	const skillFilePaths = await walkForFile(path.join(rootDir, 'skills'), SKILL_FILE_NAME);
	const bundleFilePaths = await walkForFile(path.join(rootDir, 'bundles'), BUNDLE_FILE_NAME);

	const skillEntries = await Promise.all(
		skillFilePaths.map(async (skillFilePath) => {
			const source = await readFile(skillFilePath, 'utf8');
			const parsedSkill = parseSkillMarkdown(source);
			const skillDir = path.dirname(skillFilePath);
			const stats = await collectDirectoryStats(skillDir);
			const skillRelPath = toPosixPath(path.relative(rootDir, skillDir));

			const entry: CatalogEntry = {
				path: skillRelPath,
				frontmatter: parsedSkill.frontmatter,
				description_html: await renderMarkdownToHtml(parsedSkill.frontmatter.description),
				body_html: await renderMarkdownToHtml(parsedSkill.body),
				size_bytes: stats.sizeBytes,
				files: stats.files,
				security: readAuditResult(parsedSkill.frontmatter.name),
				commit_ref: await getLastCommitForPath(rootDir, skillRelPath)
			};

			return [parsedSkill.frontmatter.name, entry] as const;
		})
	);

	const bundleEntries = await Promise.all(
		bundleFilePaths.map(async (bundleFilePath) => {
			const source = await readFile(bundleFilePath, 'utf8');
			const manifest = parseBundleManifest(source);
			return [manifest.slug, manifest] as const;
		})
	);

	const externalSkillEntries = await loadExternalEntries(rootDir);

	const skills = Object.fromEntries(sortEntries([...skillEntries, ...externalSkillEntries]));
	const bundles = Object.fromEntries(sortEntries(bundleEntries));
	const categories = Array.from(
		new Set([
			...Object.values(skills).map((entry) => entry.frontmatter.marketplace.category),
			...Object.values(bundles).map((bundle) => bundle.category)
		])
	).sort((left, right) => left.localeCompare(right));

	const catalog: Catalog = {
		version: CATALOG_VERSION,
		generated_at: metadata.generatedAt,
		commit_sha: metadata.commitSha,
		skills,
		bundles,
		categories
	};

	await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

	return catalog;
}

export function parseSkillMarkdown(source: string): { frontmatter: SkillFrontmatter; body: string } {
	const parsed = matter(source);

	if (!isRecord(parsed.data)) {
		throw new Error('Invalid SKILL.md frontmatter: expected an object');
	}

	return {
		frontmatter: parsed.data as unknown as SkillFrontmatter,
		body: parsed.content.trim()
	};
}

export function parseBundleManifest(source: string): BundleManifest {
	const parsed = parseYaml(source);

	if (!isRecord(parsed)) {
		throw new Error('Invalid bundle.yaml: expected an object');
	}

	return parsed as unknown as BundleManifest;
}

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
	const rendered = await unified().use(remarkParse).use(remarkRehype).use(rehypeSanitize).use(rehypeStringify).process(markdown);
	return String(rendered);
}

function resolveRootDir(): string {
	return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

async function resolveCatalogMetadata(rootDir: string, options: BuildCatalogOptions): Promise<CatalogMetadata> {
	if (options.commitSha && options.generatedAt) {
		return {
			commitSha: options.commitSha,
			generatedAt: options.generatedAt
		};
	}

	const [commitSha, generatedAt] = await Promise.all([
		options.commitSha ?? getGitOutput(rootDir, ['rev-parse', 'HEAD']),
		options.generatedAt ?? getGitOutput(rootDir, ['show', '-s', '--format=%cI', 'HEAD'])
	]);

	return { commitSha, generatedAt };
}

async function walkForFile(rootDir: string, targetName: string): Promise<string[]> {
	let entries;

	try {
		entries = await readdir(rootDir, { withFileTypes: true, recursive: true });
	} catch (error) {
		if (isNodeError(error) && error.code === 'ENOENT') {
			return [];
		}

		throw error;
	}

	return entries
		.filter((entry) => entry.isFile() && entry.name === targetName)
		.map((entry) => path.join(entry.parentPath, entry.name))
		.sort((left, right) => left.localeCompare(right));
}

async function collectDirectoryStats(rootDir: string): Promise<SkillDirectoryStats> {
	const entries = await readdir(rootDir, { withFileTypes: true, recursive: true });

	const files = entries
		.filter((entry) => entry.isFile())
		.map((entry) => {
			const parentPath = path.relative(rootDir, entry.parentPath);
			return parentPath ? path.join(parentPath, entry.name) : entry.name;
		})
		.map((filePath) => toPosixPath(filePath))
		.sort((left, right) => left.localeCompare(right));

	let sizeBytes = 0;
	for (const relativeFilePath of files) {
		const filePath = path.join(rootDir, relativeFilePath);
		const fileStats = await stat(filePath);
		sizeBytes += fileStats.size;
	}

	return { files, sizeBytes };
}

function readAuditResult(slug: string): SecurityAuditResult {
	const auditPath = path.join('audit-results', `${slug}.json`);
	
	if (!existsSync(auditPath)) {
		return {
			overall: 'pending',
			scanned_at: '',
			commit_sha: '',
			run_url: '',
			secrets: { status: 'pass', findings_count: 0, findings: [] },
			safety: { status: 'pass', findings_count: 0, findings: [] },
			dependencies: { status: 'not_applicable', has_deps: false, vulnerabilities_count: 0, findings: [] }
		};
	}

	try {
		const raw = JSON.parse(readFileSync(auditPath, 'utf8'));
		return raw as SecurityAuditResult;
	} catch {
		return {
			overall: 'pending',
			scanned_at: '',
			commit_sha: '',
			run_url: '',
			secrets: { status: 'pass', findings_count: 0, findings: [] },
			safety: { status: 'pass', findings_count: 0, findings: [] },
			dependencies: { status: 'not_applicable', has_deps: false, vulnerabilities_count: 0, findings: [] }
		};
	}
}

function sortEntries<T>(entries: ReadonlyArray<readonly [string, T]>): ReadonlyArray<readonly [string, T]> {
	return [...entries].sort(([left], [right]) => left.localeCompare(right));
}

function toPosixPath(filePath: string): string {
	return filePath.split(path.sep).join(path.posix.sep);
}

function isRecord(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && 'code' in error;
}

async function getGitOutput(rootDir: string, args: string[]): Promise<string> {
	const { stdout } = await execFileAsync('git', args, { cwd: rootDir });
	return stdout.trim();
}

async function getLastCommitForPath(rootDir: string, relativePath: string): Promise<string> {
	try {
		return await getGitOutput(rootDir, ['log', '-1', '--format=%h', '--', relativePath]);
	} catch {
		return '';
	}
}

interface ExternalSkillYaml {
	frontmatter: SkillFrontmatter;
	external_audit: ExternalAudit;
}

function hasFailedAudit(audit: ExternalAudit): boolean {
	return audit.trust_hub.status === 'fail' || audit.socket.status === 'fail' || audit.snyk.status === 'fail';
}

export async function loadExternalEntries(rootDir: string): Promise<Array<readonly [string, CatalogEntry]>> {
	const externalDir = path.join(rootDir, 'external');

	let dirents: string[];
	try {
		dirents = (await readdir(externalDir, { withFileTypes: true }))
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);
	} catch (error) {
		if (isNodeError(error) && error.code === 'ENOENT') {
			return [];
		}
		throw error;
	}

	const loaded: Array<readonly [string, CatalogEntry]> = [];

	for (const slug of dirents) {
		if (!VALID_IDENTIFIER.test(slug)) {
			throw new Error(
				`Invalid skill identifier "${slug}" in external/. ` +
				`Identifiers must match /^[a-z0-9_-]+$/ (lowercase letters, numbers, underscores, hyphens).`
			);
		}

		const yamlPath = path.join(externalDir, slug, 'skill.yaml');

		if (!existsSync(yamlPath)) {
			continue;
		}

		const raw = await readFile(yamlPath, 'utf8');
		const parsed = parseYaml(raw);

		if (!isRecord(parsed)) {
			console.warn(`Skipping external/${slug}: invalid skill.yaml (expected object)`);
			continue;
		}

		const external = parsed as unknown as ExternalSkillYaml;

		if (!isRecord(external.frontmatter)) {
			console.warn(`Skipping external/${slug}: missing or invalid frontmatter`);
			continue;
		}

		if (!external.external_audit) {
			console.warn(`Skipping external/${slug}: missing external_audit`);
			continue;
		}

		if (hasFailedAudit(external.external_audit)) {
			console.warn(`Skipping external/${slug}: audit has one or more 'fail' statuses`);
			continue;
		}

		const externalRelPath = toPosixPath(path.relative(rootDir, path.join(externalDir, slug)));
		const entry: CatalogEntry = {
			path: externalRelPath,
			frontmatter: external.frontmatter,
			description_html: await renderMarkdownToHtml(external.frontmatter.description),
			body_html: '',
			size_bytes: 0,
			files: [],
			security: {
				overall: 'pending',
				scanned_at: '',
				commit_sha: '',
				run_url: '',
				secrets: { status: 'pass', findings_count: 0, findings: [] },
				safety: { status: 'pass', findings_count: 0, findings: [] },
				dependencies: { status: 'not_applicable', has_deps: false, vulnerabilities_count: 0, findings: [] }
			},
			commit_ref: await getLastCommitForPath(rootDir, externalRelPath),
			source: 'skills.sh',
			identifier: slug,
			external_audit: external.external_audit
		};

		loaded.push([external.frontmatter.name, entry] as const);
	}

	return loaded;
}

async function main(): Promise<void> {
	try {
		await buildCatalog();
	} catch (error) {
		console.error(error);
		process.exitCode = 1;
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	void main();
}
