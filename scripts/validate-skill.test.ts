import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { formatValidationErrors, validateCatalog } from './validate-skill.js';

async function createFixtureRoot(): Promise<string> {
	return await mkdtemp(path.join(os.tmpdir(), 'myah-skills-'));
}

async function writeSkill(rootDir: string, slug: string, frontmatter: string, body = '# Skill\n'): Promise<void> {
	const skillDir = path.join(rootDir, 'skills', slug);
	await mkdir(skillDir, { recursive: true });
	await writeFile(path.join(skillDir, 'SKILL.md'), `---\n${frontmatter}\n---\n\n${body}`);
}

async function writeBundle(rootDir: string, slug: string, source: string): Promise<void> {
	const bundleDir = path.join(rootDir, 'bundles', slug);
	await mkdir(bundleDir, { recursive: true });
	await writeFile(path.join(bundleDir, 'bundle.yaml'), source);
}

const validSkillFrontmatter = `name: alpha-skill
description: This skill validates a complete marketplace-ready metadata block.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - validation
    - tooling
  personas:
    developer: 90
    researcher: 40
    analyst: 35
    operator: 50
    creator: 20
    support: 30
  summary: Strict validator for marketplace metadata and bundle references.
  featured: false
  requires:
    tools:
      - read
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev`;

const validBundle = `slug: starter-bundle
name: Starter bundle
summary: A valid bundle manifest that points at the existing alpha skill.
category: development
skills:
  - alpha-skill
personas:
  developer: 75
  researcher: 30
  analyst: 40
  operator: 55
  creator: 20
  support: 35
featured: true
author:
  name: Myah Team
  url: https://myah.dev`;

describe('validateCatalog', () => {
	it('passes for a valid skill and bundle set', async () => {
		const rootDir = await createFixtureRoot();
		await writeSkill(rootDir, 'alpha-skill', validSkillFrontmatter);
		await writeBundle(rootDir, 'starter-bundle', validBundle);

		const result = await validateCatalog({ cwd: rootDir });

		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it('fails when a required field is missing', async () => {
		const rootDir = await createFixtureRoot();
		await writeSkill(
			rootDir,
			'alpha-skill',
			validSkillFrontmatter.replace('  category: development\n', '')
		);

		const result = await validateCatalog({ cwd: rootDir });

		expect(result.valid).toBe(false);
		expect(formatValidationErrors(result.errors)).toContain(
			'ERROR: skills/alpha-skill/SKILL.md — missing field: marketplace.category'
		);
	});

	it('fails when a persona score is outside the allowed integer range', async () => {
		const rootDir = await createFixtureRoot();
		await writeSkill(
			rootDir,
			'alpha-skill',
			validSkillFrontmatter.replace('    developer: 90\n', '    developer: 101\n')
		);

		const result = await validateCatalog({ cwd: rootDir });

		expect(result.valid).toBe(false);
		expect(formatValidationErrors(result.errors)).toContain(
			'ERROR: skills/alpha-skill/SKILL.md — invalid field: marketplace.personas.developer must be an integer between 0 and 100'
		);
	});

	it('fails when duplicate slugs appear across marketplace entries', async () => {
		const rootDir = await createFixtureRoot();
		await writeSkill(rootDir, 'alpha-skill', validSkillFrontmatter);
		await writeBundle(
			rootDir,
			'alpha-skill',
			validBundle.replace('slug: starter-bundle\n', 'slug: alpha-skill\n')
		);

		const result = await validateCatalog({ cwd: rootDir });

		expect(result.valid).toBe(false);
		expect(formatValidationErrors(result.errors)).toContain(
			'ERROR: bundles/alpha-skill/bundle.yaml — duplicate slug: alpha-skill (already used in skills/alpha-skill/SKILL.md)'
		);
	});
});
