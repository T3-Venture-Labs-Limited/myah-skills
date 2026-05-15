import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	buildCandidateUrls,
	fetchExternalSkill,
	fetchFirstSuccess,
	listExternalSlugs,
	parseDetailUrl,
	runFetcher
} from './fetch-external-skill.js';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('parseDetailUrl', () => {
	it('parses a valid skills.sh detail URL', () => {
		expect(parseDetailUrl('https://skills.sh/juliusbrussee/caveman/caveman')).toEqual({
			author: 'juliusbrussee',
			repo: 'caveman',
			slug: 'caveman'
		});
	});

	it('parses a URL with hyphenated slugs', () => {
		expect(parseDetailUrl('https://skills.sh/coreyhaines31/marketingskills/seo-audit')).toEqual({
			author: 'coreyhaines31',
			repo: 'marketingskills',
			slug: 'seo-audit'
		});
	});

	it('throws on a non-skills.sh URL', () => {
		expect(() => parseDetailUrl('https://example.com/foo/bar/baz')).toThrow(/Invalid skills\.sh detail_url/);
	});

	it('throws on a URL with extra path segments', () => {
		expect(() => parseDetailUrl('https://skills.sh/foo/bar/baz/extra')).toThrow();
	});

	it('throws on an empty string', () => {
		expect(() => parseDetailUrl('')).toThrow();
	});
});

describe('buildCandidateUrls', () => {
	it('returns 16 URLs (8 layouts × 2 branches) in the documented order', () => {
		const urls = buildCandidateUrls({ author: 'a', repo: 'r', slug: 's' });
		expect(urls).toEqual([
			'https://raw.githubusercontent.com/a/r/main/skills/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/main/dist/skills/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/main/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/main/packages/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/main/.agents/skills/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/main/.claude/skills/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/main/.cursor/skills/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/main/SKILL.md',
			'https://raw.githubusercontent.com/a/r/master/skills/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/master/dist/skills/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/master/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/master/packages/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/master/.agents/skills/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/master/.claude/skills/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/master/.cursor/skills/s/SKILL.md',
			'https://raw.githubusercontent.com/a/r/master/SKILL.md'
		]);
	});
});

describe('fetchFirstSuccess', () => {
	it('returns the first 200 response and stops further requests', async () => {
		const calls: string[] = [];
		const mockFetch = vi.fn(async (url: string) => {
			calls.push(url);
			if (url.endsWith('/win')) {
				return new Response('winner body', { status: 200 });
			}
			return new Response('Not Found', { status: 404 });
		});
		vi.stubGlobal('fetch', mockFetch);

		const result = await fetchFirstSuccess([
			'https://example.com/lose',
			'https://example.com/win',
			'https://example.com/skipped'
		]);

		expect(result).not.toBeNull();
		expect(result?.url).toBe('https://example.com/win');
		expect(result?.body).toBe('winner body');
		expect(calls).toEqual(['https://example.com/lose', 'https://example.com/win']);
	});

	it('returns null when every URL responds 404', async () => {
		const mockFetch = vi.fn(async () => new Response('Not Found', { status: 404 }));
		vi.stubGlobal('fetch', mockFetch);

		const result = await fetchFirstSuccess(['https://example.com/a', 'https://example.com/b']);
		expect(result).toBeNull();
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('treats network errors as failed attempts and continues', async () => {
		const mockFetch = vi.fn(async (url: string) => {
			if (url.endsWith('/boom')) {
				throw new Error('ECONNRESET');
			}
			if (url.endsWith('/ok')) {
				return new Response('content', { status: 200 });
			}
			return new Response('Not Found', { status: 404 });
		});
		vi.stubGlobal('fetch', mockFetch);

		const result = await fetchFirstSuccess([
			'https://example.com/boom',
			'https://example.com/ok'
		]);

		expect(result?.body).toBe('content');
		expect(result?.url).toBe('https://example.com/ok');
	});

	it('returns null for an empty URL list', async () => {
		const result = await fetchFirstSuccess([]);
		expect(result).toBeNull();
	});
});

describe('fetchExternalSkill (integration with mocked fetch + tmpdir)', () => {
	it('writes SKILL.md to the slug directory on success', async () => {
		const rootDir = await mkdtemp(path.join(os.tmpdir(), 'fetch-external-test-'));
		const externalDir = path.join(rootDir, 'external');
		const slugDir = path.join(externalDir, 'caveman');

		try {
			await mkdir(slugDir, { recursive: true });
			await writeFile(
				path.join(slugDir, 'skill.yaml'),
				`frontmatter:
  name: caveman
external_audit:
  detail_url: https://skills.sh/juliusbrussee/caveman/caveman
`,
				'utf8'
			);

			const mockFetch = vi.fn(async (url: string) => {
				if (url === 'https://raw.githubusercontent.com/juliusbrussee/caveman/main/skills/caveman/SKILL.md') {
					return new Response('# Caveman\n\nBody.', { status: 200 });
				}
				return new Response('Not Found', { status: 404 });
			});
			vi.stubGlobal('fetch', mockFetch);

			const result = await fetchExternalSkill(externalDir, 'caveman');

			expect(result.success).not.toBeNull();
			expect(result.source).toEqual({ author: 'juliusbrussee', repo: 'caveman', slug: 'caveman' });

			const written = await readFile(path.join(slugDir, 'SKILL.md'), 'utf8');
			expect(written).toBe('# Caveman\n\nBody.');
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it('returns failure with attempts list when every candidate 404s', async () => {
		const rootDir = await mkdtemp(path.join(os.tmpdir(), 'fetch-external-test-'));
		const externalDir = path.join(rootDir, 'external');
		const slugDir = path.join(externalDir, 'critique');

		try {
			await mkdir(slugDir, { recursive: true });
			await writeFile(
				path.join(slugDir, 'skill.yaml'),
				`external_audit:
  detail_url: https://skills.sh/pbakaus/impeccable/critique
`,
				'utf8'
			);

			vi.stubGlobal(
				'fetch',
				vi.fn(async () => new Response('Not Found', { status: 404 }))
			);

			const result = await fetchExternalSkill(externalDir, 'critique');

			expect(result.success).toBeNull();
			expect(result.source).toEqual({ author: 'pbakaus', repo: 'impeccable', slug: 'critique' });
			expect(result.attempts).toHaveLength(16);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it('returns error result when skill.yaml is missing detail_url', async () => {
		const rootDir = await mkdtemp(path.join(os.tmpdir(), 'fetch-external-test-'));
		const externalDir = path.join(rootDir, 'external');
		const slugDir = path.join(externalDir, 'broken');

		try {
			await mkdir(slugDir, { recursive: true });
			await writeFile(path.join(slugDir, 'skill.yaml'), 'frontmatter:\n  name: broken\n', 'utf8');

			const result = await fetchExternalSkill(externalDir, 'broken');

			expect(result.success).toBeNull();
			expect(result.error).toMatch(/Missing external_audit\.detail_url/);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});
});

describe('listExternalSlugs', () => {
	it('returns sorted slug directories that contain skill.yaml', async () => {
		const rootDir = await mkdtemp(path.join(os.tmpdir(), 'fetch-external-test-'));
		const externalDir = path.join(rootDir, 'external');

		try {
			await mkdir(path.join(externalDir, 'zeta'), { recursive: true });
			await mkdir(path.join(externalDir, 'alpha'), { recursive: true });
			await mkdir(path.join(externalDir, 'no-yaml'), { recursive: true });
			await writeFile(path.join(externalDir, 'zeta', 'skill.yaml'), 'x', 'utf8');
			await writeFile(path.join(externalDir, 'alpha', 'skill.yaml'), 'x', 'utf8');

			const slugs = await listExternalSlugs(externalDir);
			expect(slugs).toEqual(['alpha', 'zeta']);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});
});

describe('runFetcher', () => {
	it('processes a single slug when --slug is provided', async () => {
		const rootDir = await mkdtemp(path.join(os.tmpdir(), 'fetch-external-test-'));
		const externalDir = path.join(rootDir, 'external');
		const slugDir = path.join(externalDir, 'caveman');

		try {
			await mkdir(slugDir, { recursive: true });
			await writeFile(
				path.join(slugDir, 'skill.yaml'),
				`external_audit:
  detail_url: https://skills.sh/juliusbrussee/caveman/caveman
`,
				'utf8'
			);

			vi.stubGlobal(
				'fetch',
				vi.fn(async (url: string) => {
					if (url.endsWith('/main/skills/caveman/SKILL.md')) {
						return new Response('# Caveman', { status: 200 });
					}
					return new Response('Not Found', { status: 404 });
				})
			);

			const summary = await runFetcher({ all: false, slug: 'caveman', rootDir });
			expect(summary.succeeded).toBe(1);
			expect(summary.failed).toBe(0);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it('throws when neither --all nor --slug is provided', async () => {
		const rootDir = await mkdtemp(path.join(os.tmpdir(), 'fetch-external-test-'));

		try {
			await mkdir(path.join(rootDir, 'external'), { recursive: true });
			await expect(runFetcher({ all: false, slug: null, rootDir })).rejects.toThrow(
				/Must specify --all or --slug/
			);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});
});
