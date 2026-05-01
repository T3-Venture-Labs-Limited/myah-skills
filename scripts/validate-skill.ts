import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import yaml from 'js-yaml';

import type {
	BundleManifest,
	SkillAuthor,
	SkillFrontmatter,
	SkillRequires
} from '../types/skill.js';

const SKILL_FILE_NAME = 'SKILL.md';
const BUNDLE_FILE_NAME = 'bundle.yaml';
const SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;
const TAG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;
const VALID_ROLES = new Set<SkillFrontmatter['role']>(['tool', 'router', 'workflow', 'assistant']);
const VALID_CATEGORIES = new Set([
	'e-commerce',
	'finance',
	'productivity',
	'analytics',
	'communication',
	'development',
	'engineering',
	'marketing',
	'operations',
	'research',
	'support',
	'writing'
]);
type JsonObject = Record<string, unknown>;

export interface ValidationError {
	path: string;
	message: string;
}

export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
}

export interface ValidateCatalogOptions {
	skillsDir?: string;
	bundlesDir?: string;
	cwd?: string;
}

interface ParsedSkill {
	filePath: string;
	relativePath: string;
	frontmatter: SkillFrontmatter | null;
}

interface ParsedBundle {
	filePath: string;
	relativePath: string;
	manifest: BundleManifest | null;
}

function isRecord(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function createError(errors: ValidationError[], filePath: string, message: string): void {
	errors.push({ path: filePath, message });
}

async function walkForFile(rootDir: string, targetName: string): Promise<string[]> {
	let entries;

	try {
		entries = await readdir(rootDir, { withFileTypes: true, recursive: true });
	} catch (error) {
		if (
			error &&
			typeof error === 'object' &&
			'code' in error &&
			error.code === 'ENOENT'
		) {
			return [];
		}

		throw error;
	}

	return entries
		.filter((entry) => entry.isFile() && entry.name === targetName)
		.map((entry) => path.join(entry.parentPath, entry.name))
		.sort((left, right) => left.localeCompare(right));
}

function validateSlug(value: unknown, fieldPath: string, filePath: string, errors: ValidationError[]): value is string {
	if (typeof value !== 'string' || value.length === 0) {
		createError(errors, filePath, `missing field: ${fieldPath}`);
		return false;
	}

	if (!SLUG_PATTERN.test(value)) {
		createError(errors, filePath, `invalid field: ${fieldPath} must match ${SLUG_PATTERN.source}`);
		return false;
	}

	return true;
}

function validateLength(
	value: unknown,
	fieldPath: string,
	filePath: string,
	errors: ValidationError[],
	minimum: number,
	maximum: number
): value is string {
	if (typeof value !== 'string' || value.trim().length === 0) {
		createError(errors, filePath, `missing field: ${fieldPath}`);
		return false;
	}

	const trimmed = value.trim();
	if (trimmed.length < minimum || trimmed.length > maximum) {
		createError(
			errors,
			filePath,
			`invalid field: ${fieldPath} must be ${minimum}-${maximum} characters`
		);
		return false;
	}

	return true;
}

function validateBooleanOptional(
	value: unknown,
	fieldPath: string,
	filePath: string,
	errors: ValidationError[]
): boolean {
	if (typeof value === 'undefined') {
		return true;
	}

	if (typeof value !== 'boolean') {
		createError(errors, filePath, `invalid field: ${fieldPath} must be a boolean`);
		return false;
	}

	return true;
}

function validateAuthor(
	value: unknown,
	fieldPath: string,
	filePath: string,
	errors: ValidationError[]
): value is SkillAuthor {
	if (!isRecord(value)) {
		createError(errors, filePath, `missing field: ${fieldPath}`);
		return false;
	}

	let valid = true;
	if (typeof value.name !== 'string' || value.name.trim().length === 0) {
		createError(errors, filePath, `missing field: ${fieldPath}.name`);
		valid = false;
	}

	if (typeof value.url !== 'undefined') {
		if (typeof value.url !== 'string' || value.url.trim().length === 0) {
			createError(errors, filePath, `invalid field: ${fieldPath}.url must be a valid URL`);
			valid = false;
		} else {
			try {
				new URL(value.url);
			} catch {
				createError(errors, filePath, `invalid field: ${fieldPath}.url must be a valid URL`);
				valid = false;
			}
		}
	}

	return valid;
}

function validateRequires(
	value: unknown,
	fieldPath: string,
	filePath: string,
	errors: ValidationError[]
): value is SkillRequires | undefined {
	if (typeof value === 'undefined') {
		return true;
	}

	if (!isRecord(value)) {
		createError(errors, filePath, `invalid field: ${fieldPath} must be an object`);
		return false;
	}

	let valid = true;
	for (const key of ['tools', 'mcp', 'env'] as const) {
		const item = value[key];
		if (typeof item !== 'undefined' && !isStringArray(item)) {
			createError(errors, filePath, `invalid field: ${fieldPath}.${key} must be a string array`);
			valid = false;
		}
	}

	return valid;
}

function validateCategory(value: unknown, fieldPath: string, filePath: string, errors: ValidationError[]): value is string {
	if (typeof value !== 'string' || value.trim().length === 0) {
		createError(errors, filePath, `missing field: ${fieldPath}`);
		return false;
	}

	if (!VALID_CATEGORIES.has(value)) {
		createError(errors, filePath, `invalid field: ${fieldPath} must be a curated category`);
		return false;
	}

	return true;
}

function validateTags(value: unknown, fieldPath: string, filePath: string, errors: ValidationError[]): value is string[] {
	if (!isStringArray(value)) {
		createError(errors, filePath, `missing field: ${fieldPath}`);
		return false;
	}

	let valid = true;
	if (value.length < 1 || value.length > 10) {
		createError(errors, filePath, `invalid field: ${fieldPath} must have 1-10 items`);
		valid = false;
	}

	for (const tag of value) {
		if (!TAG_PATTERN.test(tag)) {
			createError(errors, filePath, `invalid field: ${fieldPath} entries must be lowercase-kebab strings`);
			valid = false;
		}
	}

	return valid;
}

function validateMarketplace(
	value: unknown,
	filePath: string,
	errors: ValidationError[]
): value is SkillFrontmatter['marketplace'] {
	if (!isRecord(value)) {
		createError(errors, filePath, 'missing field: marketplace');
		return false;
	}

	let valid = true;
	valid = validateCategory(value.category, 'marketplace.category', filePath, errors) && valid;
	valid = validateTags(value.tags, 'marketplace.tags', filePath, errors) && valid;
	valid = validateLength(value.summary, 'marketplace.summary', filePath, errors, 20, 120) && valid;
	valid = validateBooleanOptional(value.featured, 'marketplace.featured', filePath, errors) && valid;
	valid = validateRequires(value.requires, 'marketplace.requires', filePath, errors) && valid;
	valid = validateAuthor(value.author, 'marketplace.author', filePath, errors) && valid;

	return valid;
}

function validateSkillFrontmatter(
	value: unknown,
	filePath: string,
	errors: ValidationError[]
): value is SkillFrontmatter {
	if (!isRecord(value)) {
		createError(errors, filePath, 'missing YAML frontmatter');
		return false;
	}

	let valid = true;
	valid = validateSlug(value.name, 'name', filePath, errors) && valid;
	valid = validateLength(value.description, 'description', filePath, errors, 20, 500) && valid;
	valid = validateLength(value.license, 'license', filePath, errors, 1, 120) && valid;

	if (typeof value.role !== 'string') {
		createError(errors, filePath, 'missing field: role');
		valid = false;
	} else if (!VALID_ROLES.has(value.role as SkillFrontmatter['role'])) {
		createError(errors, filePath, 'invalid field: role must be one of tool, router, workflow');
		valid = false;
	}

	if (typeof value.version !== 'string' || value.version.trim().length === 0) {
		createError(errors, filePath, 'missing field: version');
		valid = false;
	} else if (!SEMVER_PATTERN.test(value.version)) {
		createError(errors, filePath, 'invalid field: version must be semver');
		valid = false;
	}

	valid = validateMarketplace(value.marketplace, filePath, errors) && valid;
	return valid;
}

function validateBundleManifest(
	value: unknown,
	filePath: string,
	errors: ValidationError[]
): value is BundleManifest {
	if (!isRecord(value)) {
		createError(errors, filePath, 'invalid YAML document');
		return false;
	}

	let valid = true;
	valid = validateSlug(value.slug, 'slug', filePath, errors) && valid;
	valid = validateLength(value.name, 'name', filePath, errors, 1, 120) && valid;
	valid = validateLength(value.summary, 'summary', filePath, errors, 20, 500) && valid;
	valid = validateCategory(value.category, 'category', filePath, errors) && valid;
	valid = validateBooleanOptional(value.featured, 'featured', filePath, errors) && valid;
	valid = validateAuthor(value.author, 'author', filePath, errors) && valid;

	if (!isStringArray(value.skills)) {
		createError(errors, filePath, 'missing field: skills');
		valid = false;
	} else {
		if (value.skills.length < 1 || value.skills.length > 50) {
			createError(errors, filePath, 'invalid field: skills must have 1-50 items');
			valid = false;
		}

		for (const skillName of value.skills) {
			if (!SLUG_PATTERN.test(skillName)) {
				createError(errors, filePath, 'invalid field: skills entries must be valid skill names');
				valid = false;
			}
		}
	}

	return valid;
}

async function parseSkillFile(filePath: string, cwd: string, errors: ValidationError[]): Promise<ParsedSkill> {
	const relativePath = path.relative(cwd, filePath) || filePath;

	try {
		const source = await readFile(filePath, 'utf8');
		const parsed = matter(source);
		const frontmatter = validateSkillFrontmatter(parsed.data, relativePath, errors) ? parsed.data : null;

		return { filePath, relativePath, frontmatter };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		createError(errors, relativePath, `failed to parse frontmatter: ${message}`);
		return { filePath, relativePath, frontmatter: null };
	}
}

async function parseBundleFile(filePath: string, cwd: string, errors: ValidationError[]): Promise<ParsedBundle> {
	const relativePath = path.relative(cwd, filePath) || filePath;

	try {
		const source = await readFile(filePath, 'utf8');
		const parsed = yaml.load(source);
		const manifest = validateBundleManifest(parsed, relativePath, errors) ? parsed : null;

		return { filePath, relativePath, manifest };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		createError(errors, relativePath, `failed to parse YAML: ${message}`);
		return { filePath, relativePath, manifest: null };
	}
}

function validateDuplicateSlugs(
	skills: ParsedSkill[],
	bundles: ParsedBundle[],
	errors: ValidationError[]
): void {
	const seen = new Map<string, string>();

	for (const skill of skills) {
		const slug = skill.frontmatter?.name;
		if (!slug) {
			continue;
		}

		const existing = seen.get(slug);
		if (existing) {
			createError(errors, skill.relativePath, `duplicate slug: ${slug} (already used in ${existing})`);
			continue;
		}

		seen.set(slug, skill.relativePath);
	}

	for (const bundle of bundles) {
		const slug = bundle.manifest?.slug;
		if (!slug) {
			continue;
		}

		const existing = seen.get(slug);
		if (existing) {
			createError(errors, bundle.relativePath, `duplicate slug: ${slug} (already used in ${existing})`);
			continue;
		}

		seen.set(slug, bundle.relativePath);
	}
}

function validateBundleMembers(skills: ParsedSkill[], bundles: ParsedBundle[], errors: ValidationError[]): void {
	const knownSkills = new Set(skills.flatMap((skill) => (skill.frontmatter ? [skill.frontmatter.name] : [])));

	for (const bundle of bundles) {
		if (!bundle.manifest) {
			continue;
		}

		for (const member of bundle.manifest.skills) {
			if (!knownSkills.has(member)) {
				createError(errors, bundle.relativePath, `missing skill reference: ${member}`);
			}
		}
	}
}

export async function validateCatalog(options: ValidateCatalogOptions = {}): Promise<ValidationResult> {
	const cwd = path.resolve(options.cwd ?? process.cwd());
	const skillsDir = path.resolve(cwd, options.skillsDir ?? 'skills');
	const bundlesDir = path.resolve(cwd, options.bundlesDir ?? 'bundles');
	const errors: ValidationError[] = [];

	const [skillFiles, bundleFiles] = await Promise.all([
		walkForFile(skillsDir, SKILL_FILE_NAME),
		walkForFile(bundlesDir, BUNDLE_FILE_NAME)
	]);

	const [skills, bundles] = await Promise.all([
		Promise.all(skillFiles.map((filePath) => parseSkillFile(filePath, cwd, errors))),
		Promise.all(bundleFiles.map((filePath) => parseBundleFile(filePath, cwd, errors)))
	]);

	validateDuplicateSlugs(skills, bundles, errors);
	validateBundleMembers(skills, bundles, errors);

	errors.sort((left, right) => `${left.path} ${left.message}`.localeCompare(`${right.path} ${right.message}`));

	return {
		valid: errors.length === 0,
		errors
	};
}

export function formatValidationErrors(errors: ValidationError[]): string[] {
	return errors.map((error) => `ERROR: ${error.path} — ${error.message}`);
}

function parseCliArgs(argv: string[]): ValidateCatalogOptions {
	const positional: string[] = [];
	const options: ValidateCatalogOptions = {};

	for (let index = 0; index < argv.length; index += 1) {
		const value = argv[index];
		if (value === '--skills-dir') {
			options.skillsDir = argv[index + 1];
			index += 1;
			continue;
		}

		if (value === '--bundles-dir') {
			options.bundlesDir = argv[index + 1];
			index += 1;
			continue;
		}

		positional.push(value);
	}

	if (!options.skillsDir && positional[0]) {
		options.skillsDir = positional[0];
	}

	if (!options.bundlesDir && positional[1]) {
		options.bundlesDir = positional[1];
	}

	return options;
}

async function main(): Promise<void> {
	const result = await validateCatalog(parseCliArgs(process.argv.slice(2)));

	if (!result.valid) {
		for (const line of formatValidationErrors(result.errors)) {
			console.error(line);
		}

		process.exitCode = 1;
	}
}

const isEntrypoint =
	typeof process.argv[1] === 'string' && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
	await main();
}
