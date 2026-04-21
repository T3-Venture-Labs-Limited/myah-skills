/**
 * Six-axis persona radar scores.
 * Every skill and bundle must declare scores for all six axes.
 * Scores are integers from 0 to 100.
 */
export interface PersonaAxis {
	/** Building, coding, API work. */
	developer: number;

	/** Deep investigation, literature review. */
	researcher: number;

	/** Data analysis, metrics, reporting. */
	analyst: number;

	/** Day-to-day operations, workflows. */
	operator: number;

	/** Content creation, design, writing. */
	creator: number;

	/** Customer support, troubleshooting. */
	support: number;
}

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
	 * One of: `tool`, `router`, `workflow`
	 */
	role: 'tool' | 'router' | 'workflow';

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
	 * Persona radar scores.
	 * All 6 keys must be present, each an integer 0–100.
	 */
	personas: PersonaAxis;

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
	 * Bundle-level persona radar scores.
	 * All 6 keys must be present, each an integer 0–100.
	 */
	personas: PersonaAxis;

	/**
	 * If `true`, shown in the Featured section.
	 * Defaults to `false`.
	 */
	featured?: boolean;

	/** Attribution for the bundle. */
	author: SkillAuthor;
}

/**
 * Result from a single security audit tool.
 */
export interface SecurityAuditToolResult {
	/**
	 * Status of the audit.
	 * Varies by tool — see SecurityAuditResult for valid values per tool.
	 */
	status: string;

	/** URL to the full report on the tool's own site. */
	url: string;
}

/**
 * Gen Agent Trust Hub scan result.
 */
export interface GenAgentTrustHubResult extends SecurityAuditToolResult {
	/** One of: `pass`, `warning`, `fail`, `high_risk` */
	status: 'pass' | 'warning' | 'fail' | 'high_risk';

	/** ISO 8601 timestamp of the check. */
	checked_at: string;
}

/**
 * Socket.dev supply-chain scan result.
 */
export interface SocketResult extends SecurityAuditToolResult {
	/** One of: `pass`, `alerts` */
	status: 'pass' | 'alerts';

	/** Number of alerts found (0 = clean). */
	alerts: number;
}

/**
 * Snyk CVE + license scan result.
 */
export interface SnykResult extends SecurityAuditToolResult {
	/** One of: `safe`, `low_risk`, `med_risk`, `high_risk`, `critical` */
	status: 'safe' | 'low_risk' | 'med_risk' | 'high_risk' | 'critical';
}

/**
 * Combined security audit results from the three CI checks.
 * Stored per-skill in catalog.json.
 */
export interface SecurityAuditResult {
	/** Gen Agent Trust Hub scan result. */
	genAgentTrustHub: GenAgentTrustHubResult;

	/** Socket.dev supply-chain scan result. */
	socket: SocketResult;

	/** Snyk CVE + license scan result. */
	snyk: SnykResult;
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
