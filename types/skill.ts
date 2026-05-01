/**
 * Declarative capability requirements for a skill.
 * Shown on the install approval screen.
 */
export interface SkillRequires {
	/** Tool names the skill requires. */
	tools: string[];

	/** MCP server names the skill requires. */
	mcp: string[];

	/** Environment variable names the skill expects. */
	env: string[];
}

/**
 * Author attribution for a skill or bundle.
 */
export interface SkillAuthor {
	/** Author or team name. */
	name: string;

	/** Link to author website or profile. */
	url?: string;
}

/**
 * Hermes-native frontmatter fields.
 * These are recognized by the Hermes agent runtime.
 */
export interface HermesFrontmatter {
	/**
	 * Unique skill identifier, kebab-case.
	 * Pattern: `^[a-z][a-z0-9-]{1,63}$`
	 */
	name: string;

	/**
	 * One-line description of what the skill does.
	 * 20–500 characters.
	 */
	description: string;

	/** License under which the skill is distributed. SPDX identifier or custom string. */
	license: string;

	/**
	 * Hermes runtime role classification.
	 * One of: `tool`, `router`, `workflow`, `assistant`
	 */
	role: 'tool' | 'router' | 'workflow' | 'assistant';

	/**
	 * Informational version; pinning uses commit SHA.
	 * Semver format (e.g. `1.0.0`).
	 */
	version: string;
}

/**
 * Marketplace-specific frontmatter fields.
 * Lives inside the `marketplace:` block of SKILL.md frontmatter.
 * Purely additive — Hermes ignores unknown keys.
 */
export interface MarketplaceFrontmatter {
	/**
	 * Broad category driving category filter.
	 * Must be one of the curated category list.
	 */
	category: string;

	/**
	 * Specific tags driving search.
	 * 1–10 items, lowercase-kebab strings.
	 */
	tags: string[];

	/**
	 * One-line marketplace summary.
	 * 20–120 characters.
	 */
	summary: string;

	/**
	 * If `true`, shown in the Featured section.
	 * Defaults to `false`.
	 */
	featured?: boolean;

	/**
	 * Declarative capability list for the approval screen.
	 * Optional.
	 */
	requires?: SkillRequires;

	/**
	 * Human-readable capability descriptions for the approval screen.
	 * Each item describes one thing the skill can do.
	 * Optional.
	 */
	capabilities?: Array<{ title: string; description: string }>;

	/**
	 * Optional custom icon URL.
	 * If absent, the platform falls back to the deterministic SkillGlyph.
	 */
	icon?: string;

	/** Attribution for the skill. */
	author: SkillAuthor;
}

/**
 * Complete SKILL.md frontmatter — Hermes fields plus the marketplace block.
 */
export interface SkillFrontmatter extends HermesFrontmatter {
	/** Marketplace-specific metadata block. */
	marketplace: MarketplaceFrontmatter;
}

/**
 * Bundle manifest as defined in `bundle.yaml`.
 */
export interface BundleManifest {
	/**
	 * Unique bundle identifier, kebab-case.
	 * Pattern: `^[a-z][a-z0-9-]{1,63}$`
	 */
	slug: string;

	/**
	 * Human-readable bundle name.
	 * 1–120 characters.
	 */
	name: string;

	/**
	 * One-line description of the bundle.
	 * 20–500 characters.
	 */
	summary: string;

	/**
	 * Broad category for filtering.
	 * Must be one of the curated category list.
	 */
	category: string;

	/**
	 * Member skills included in the bundle.
	 * Each item must be a valid skill `name`.
	 */
	skills: string[];

	/**
	 * If `true`, shown in the Featured section.
	 * Defaults to `false`.
	 */
	featured?: boolean;

	/** Attribution for the bundle. */
	author: SkillAuthor;
}

/**
 * A finding from the secrets scan (TruffleHog).
 */
export interface SecretFinding {
	rule: string;
	severity: 'fail';
	file: string;
	line: number;
	verified: boolean;
	raw?: string;
}

/**
 * A finding from the safety scan (Semgrep).
 */
export interface SafetyFinding {
	rule: string;
	severity: 'ERROR' | 'WARNING' | 'INFO';
	file: string;
	line: number;
	message: string;
	snippet?: string;
}

/**
 * A finding from the dependency scan (npm audit / pip-audit).
 */
export interface DependencyFinding {
	package: string;
	installed_version: string;
	severity: 'low' | 'moderate' | 'high' | 'critical';
	cve?: string;
	advisory_url?: string;
	fixed_in?: string;
}

/**
 * Result of the secrets scan check.
 */
export interface SecretsCheck {
	status: 'pass' | 'fail';
	findings_count: number;
	findings: SecretFinding[];
}

/**
 * Result of the safety check.
 */
export interface SafetyCheck {
	status: 'pass' | 'warn' | 'fail';
	findings_count: number;
	findings: SafetyFinding[];
}

/**
 * Result of the dependency audit check.
 */
export interface DependenciesCheck {
	status: 'pass' | 'warn' | 'fail' | 'not_applicable';
	has_deps: boolean;
	vulnerabilities_count: number;
	findings: DependencyFinding[];
}

/**
 * Combined security audit results from the three CI checks.
 * Stored per-skill in catalog.json.
 */
export interface SecurityAuditResult {
	/** Overall status: pass if all checks pass, warn if any warn, fail if any fail. */
	overall: 'pass' | 'warn' | 'fail' | 'pending';

	/** ISO 8601 timestamp when the audit ran. */
	scanned_at: string;

	/** Full 40-character Git commit SHA of the myah-skills repo at audit time. */
	commit_sha: string;

	/** URL to the GitHub Actions run that produced these results. */
	run_url: string;

	/** Secrets scan results (TruffleHog). */
	secrets: SecretsCheck;

	/** Safety check results (Semgrep with Myah rules). */
	safety: SafetyCheck;

	/** Dependency audit results (npm audit / pip-audit). */
	dependencies: DependenciesCheck;
}

/**
 * A single audit check from an external source (skills.sh).
 */
export interface AuditCheck {
	/** Result of the check. Entries with any `fail` are excluded from the catalog. */
	status: 'pass' | 'warn' | 'fail';

	/** URL to the detailed report for this specific check. */
	detail_url?: string;
}

/**
 * Audit results fetched from the external source (skills.sh).
 * Only present for entries with `source: 'skills.sh'`.
 */
export interface ExternalAudit {
	/** Gen Agent Trust Hub scan result. */
	trust_hub: AuditCheck;

	/** Socket.dev supply-chain scan result. */
	socket: AuditCheck;

	/** Snyk CVE + license scan result. */
	snyk: AuditCheck;

	/** ISO 8601 timestamp of the most recent scan. */
	last_scanned: string;

	/** URL to the full audit report on the external platform. */
	detail_url: string;
}

/**
 * A single skill entry in the generated catalog.
 */
export interface CatalogEntry {
	/**
	 * Relative path to the skill directory.
	 * Example: `skills/shopify-order-analyzer`
	 */
	path: string;

	/** Full parsed frontmatter object. */
	frontmatter: SkillFrontmatter;

	/** Rendered HTML of the frontmatter `description` field. */
	description_html: string;

	/** Rendered HTML of the SKILL.md body (below frontmatter). */
	body_html: string;

	/** Total size in bytes of all files in the skill directory. */
	size_bytes: number;

	/** List of relative file paths inside the skill directory. */
	files: string[];

	/** Results from the three CI security checks. */
	security: SecurityAuditResult;

	/**
	 * Short git SHA of the most recent commit that touched any file inside
	 * this skill's directory. Empty string when not in a git checkout.
	 *
	 * Used by the platform's update-detection: each install records this
	 * value, and a "Update available" badge appears when the catalog's
	 * current `commit_ref` differs from the recorded one.
	 */
	commit_ref?: string;

	/**
	 * Where the skill originates.
	 * Defaults to `'internal'` if absent (backward-compatible).
	 */
	source?: 'internal' | 'skills.sh';

	/**
	 * Unique identifier on the source platform.
	 * For `skills.sh` entries, the skills.sh slug.
	 */
	identifier?: string;

	/**
	 * Audit results from the external source.
	 * Only present for `source: 'skills.sh'` entries.
	 */
	external_audit?: ExternalAudit | null;
}

/**
 * The root object of `catalog.json`.
 * Generated by `scripts/build-catalog.ts` on every PR merge.
 */
export interface Catalog {
	/** Schema version (currently `1`). */
	version: number;

	/** ISO 8601 timestamp of generation. */
	generated_at: string;

	/** Full 40-character Git commit SHA at generation time. */
	commit_sha: string;

	/** Map of skill name → catalog entry. */
	skills: Record<string, CatalogEntry>;

	/** Map of bundle slug → bundle manifest. */
	bundles: Record<string, BundleManifest>;

	/** Sorted list of all unique categories across skills and bundles. */
	categories: string[];
}
