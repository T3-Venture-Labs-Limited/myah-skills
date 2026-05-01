import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { Catalog } from '../types/skill.js';
import { buildCatalog, loadExternalEntries } from './build-catalog.js';

const FIXED_COMMIT_SHA = '1234567890abcdef1234567890abcdef12345678';
const FIXED_GENERATED_AT = '2026-04-21T12:00:00.000Z';

describe('buildCatalog', () => {
	it('builds a catalog from skill and bundle fixtures', async () => {
		const rootDir = await createFixtureRoot();

		try {
			const catalog = await buildCatalog({
				rootDir,
				commitSha: FIXED_COMMIT_SHA,
				generatedAt: FIXED_GENERATED_AT
			});

			assertCatalogShape(catalog);
			expect(Object.keys(catalog.skills)).toEqual(['alpha-skill', 'zeta-skill']);
			expect(Object.keys(catalog.bundles)).toEqual(['starter-bundle']);
			expect(catalog.categories).toEqual(['analytics', 'operations']);
			expect(catalog.skills['alpha-skill'].body_html).toContain('<h1>Alpha Skill</h1>');
			expect(catalog.skills['alpha-skill'].description_html).toContain('<p>Alpha description');
			expect(catalog.skills['alpha-skill'].files).toEqual(['docs/guide.md', 'SKILL.md']);
			expect(catalog.skills['alpha-skill'].security.overall).toBe('pending');
		expect(catalog.skills['alpha-skill'].security.secrets.status).toBe('pass');
		expect(catalog.skills['alpha-skill'].security.safety.status).toBe('pass');

			const writtenCatalog = JSON.parse(await readFile(path.join(rootDir, 'catalog.json'), 'utf8')) as Catalog;
			expect(writtenCatalog).toEqual(catalog);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it('produces deterministic output for identical input', async () => {
		const rootDir = await createFixtureRoot();

		try {
			const first = await buildCatalog({
				rootDir,
				outputPath: path.join(rootDir, 'catalog.first.json'),
				commitSha: FIXED_COMMIT_SHA,
				generatedAt: FIXED_GENERATED_AT
			});
			const second = await buildCatalog({
				rootDir,
				outputPath: path.join(rootDir, 'catalog.second.json'),
				commitSha: FIXED_COMMIT_SHA,
				generatedAt: FIXED_GENERATED_AT
			});

			expect(second).toEqual(first);

			const [firstJson, secondJson] = await Promise.all([
				readFile(path.join(rootDir, 'catalog.first.json'), 'utf8'),
				readFile(path.join(rootDir, 'catalog.second.json'), 'utf8')
			]);

			expect(secondJson).toBe(firstJson);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it('includes external entries with all-pass audits', async () => {
		const rootDir = await createFixtureRoot();
		await createExternalSkill(rootDir, 'ext-pass-skill', {
			audit: { trust_hub: 'pass', socket: 'pass', snyk: 'pass' }
		});

		try {
			const entries = await loadExternalEntries(rootDir);
			expect(entries).toHaveLength(1);
			const [name, entry] = entries[0];
			expect(name).toBe('ext-pass-skill');
			expect(entry.source).toBe('skills.sh');
			expect(entry.identifier).toBe('ext-pass-skill');
			expect(entry.external_audit?.trust_hub.status).toBe('pass');
			expect(entry.external_audit?.socket.status).toBe('pass');
			expect(entry.external_audit?.snyk.status).toBe('pass');
			expect(entry.body_html).toBe('');
			expect(entry.size_bytes).toBe(0);
			expect(entry.files).toEqual([]);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it('excludes external entries with any failed audit', async () => {
		const rootDir = await createFixtureRoot();
		await createExternalSkill(rootDir, 'ext-fail-skill', {
			audit: { trust_hub: 'pass', socket: 'fail', snyk: 'warn' }
		});

		try {
			const entries = await loadExternalEntries(rootDir);
			expect(entries).toHaveLength(0);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it('includes external entries with mixed pass/warn audits', async () => {
		const rootDir = await createFixtureRoot();
		await createExternalSkill(rootDir, 'ext-warn-skill', {
			audit: { trust_hub: 'pass', socket: 'warn', snyk: 'pass' }
		});

		try {
			const entries = await loadExternalEntries(rootDir);
			expect(entries).toHaveLength(1);
			const [name, entry] = entries[0];
			expect(name).toBe('ext-warn-skill');
			expect(entry.external_audit?.socket.status).toBe('warn');
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it('merges external entries into catalog alongside internal skills', async () => {
		const rootDir = await createFixtureRoot();
		await createExternalSkill(rootDir, 'ext-merged-skill', {
			audit: { trust_hub: 'pass', socket: 'pass', snyk: 'pass' }
		});

		try {
			const catalog = await buildCatalog({
				rootDir,
				commitSha: FIXED_COMMIT_SHA,
				generatedAt: FIXED_GENERATED_AT
			});

			expect(Object.keys(catalog.skills)).toContain('ext-merged-skill');
			expect(catalog.skills['ext-merged-skill'].source).toBe('skills.sh');
			expect(catalog.skills['alpha-skill'].source).toBeUndefined();
			expect(catalog.skills['zeta-skill'].source).toBeUndefined();
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});
});

function assertCatalogShape(catalog: Catalog): void {
	expect(catalog.version).toBe(1);
	expect(catalog.commit_sha).toBe(FIXED_COMMIT_SHA);
	expect(catalog.generated_at).toBe(FIXED_GENERATED_AT);
	expect(catalog.skills['alpha-skill']).toBeDefined();
	expect(catalog.bundles['starter-bundle']).toBeDefined();
	expect(typeof catalog.skills['alpha-skill'].frontmatter.marketplace.author.name).toBe('string');
	expect(typeof catalog.skills['alpha-skill'].size_bytes).toBe('number');
	expect(Array.isArray(catalog.skills['alpha-skill'].files)).toBe(true);
	expect(Array.isArray(catalog.bundles['starter-bundle'].skills)).toBe(true);
}

async function createFixtureRoot(): Promise<string> {
	const rootDir = await mkdtemp(path.join(os.tmpdir(), 'myah-skills-catalog-'));
	await mkdir(path.join(rootDir, 'skills', 'zeta-skill'), { recursive: true });
	await mkdir(path.join(rootDir, 'skills', 'alpha-skill', 'docs'), { recursive: true });
	await mkdir(path.join(rootDir, 'bundles', 'starter-bundle'), { recursive: true });

	await writeFile(
		path.join(rootDir, 'skills', 'zeta-skill', 'SKILL.md'),
		`---
name: zeta-skill
description: Zeta description with **markdown** support for operators.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - zeta
  summary: Zeta summary for operations teams in the marketplace.
  author:
    name: Team Zeta
---

# Zeta Skill

Body for the zeta skill.
`,
		'utf8'
	);

	await writeFile(
		path.join(rootDir, 'skills', 'alpha-skill', 'SKILL.md'),
		`---
name: alpha-skill
description: Alpha description with _markdown_ formatting for analysts.
license: MIT
role: workflow
version: 1.2.0
marketplace:
  category: analytics
  tags:
    - alpha
    - reporting
  summary: Alpha summary for analytics teams using the marketplace.
  featured: true
  requires:
    tools:
      - web-search
    mcp: []
    env:
      - OPENROUTER_API_KEY
  author:
    name: Team Alpha
    url: https://example.com/alpha
---

# Alpha Skill

- First bullet
- Second bullet
`,
		'utf8'
	);

	await writeFile(path.join(rootDir, 'skills', 'alpha-skill', 'docs', 'guide.md'), 'Guide body\n', 'utf8');

	await writeFile(
		path.join(rootDir, 'bundles', 'starter-bundle', 'bundle.yaml'),
		`slug: starter-bundle
name: Starter Bundle
summary: Helpful bundle for analytics and operations work on day one.
category: analytics
skills:
  - zeta-skill
  - alpha-skill
featured: true
author:
  name: Bundle Team
  url: https://example.com/bundles
`,
		'utf8'
	);

	return rootDir;
}

interface ExternalAuditConfig {
	trust_hub: 'pass' | 'warn' | 'fail';
	socket: 'pass' | 'warn' | 'fail';
	snyk: 'pass' | 'warn' | 'fail';
}

async function createExternalSkill(
	rootDir: string,
	slug: string,
	options: { audit: ExternalAuditConfig }
): Promise<void> {
	const skillDir = path.join(rootDir, 'external', slug);
	await mkdir(skillDir, { recursive: true });

	const yaml = `frontmatter:
  name: ${slug}
  description: External skill ${slug} from skills.sh
  license: Apache-2.0
  role: tool
  version: 1.0.0
  marketplace:
    category: development
    tags:
      - ${slug}
    summary: External skill ${slug} from skills.sh
    author:
      name: External Author
external_audit:
  trust_hub:
    status: ${options.audit.trust_hub}
  socket:
    status: ${options.audit.socket}
  snyk:
    status: ${options.audit.snyk}
  last_scanned: "2026-04-20T10:00:00Z"
  detail_url: "https://skills.sh/skills/${slug}"
`;

	await writeFile(path.join(skillDir, 'skill.yaml'), yaml, 'utf8');
}
