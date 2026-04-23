#!/usr/bin/env node
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUTPUT_DIR = '/home/zac/Desktop/development/myah-skills/skills';

// Map skills to categories
const CATEGORY_MAP = {
  'ab-test-setup': 'marketing',
  'ad-creative': 'marketing',
  'ai-seo': 'marketing',
  'analytics-tracking': 'analytics',
  'aso-audit': 'marketing',
  'churn-prevention': 'marketing',
  'cold-email': 'marketing',
  'community-marketing': 'marketing',
  'competitor-alternatives': 'marketing',
  'competitor-profiling': 'marketing',
  'content-strategy': 'marketing',
  'copy-editing': 'communication',
  'copywriting': 'communication',
  'customer-research': 'research',
  'directory-submissions': 'marketing',
  'email-sequence': 'marketing',
  'form-cro': 'marketing',
  'free-tool-strategy': 'marketing',
  'launch-strategy': 'marketing',
  'lead-magnets': 'marketing',
  'marketing-ideas': 'marketing',
  'marketing-psychology': 'marketing',
  'onboarding-cro': 'marketing',
  'page-cro': 'marketing',
  'paid-ads': 'marketing',
  'paywall-upgrade-cro': 'marketing',
  'popup-cro': 'marketing',
  'pricing-strategy': 'marketing',
  'product-marketing-context': 'marketing',
  'programmatic-seo': 'marketing',
  'referral-program': 'marketing',
  'revops': 'operations',
  'sales-enablement': 'marketing',
  'schema-markup': 'marketing',
  'seo-audit': 'marketing',
  'signup-flow-cro': 'marketing',
  'site-architecture': 'marketing',
  'social-content': 'marketing'
};

// Persona scores based on skill type
function getPersonas(skillName) {
  const researchSkills = ['customer-research', 'competitor-profiling', 'analytics-tracking'];
  const creatorSkills = ['copywriting', 'copy-editing', 'ad-creative', 'social-content', 'content-strategy'];
  const opsSkills = ['revops', 'email-sequence', 'analytics-tracking'];
  const devSkills = ['ai-seo', 'programmatic-seo', 'schema-markup', 'site-architecture', 'ab-test-setup'];
  
  return {
    developer: devSkills.includes(skillName) ? 70 : 30,
    researcher: researchSkills.includes(skillName) ? 80 : 40,
    analyst: ['analytics-tracking', 'ab-test-setup', 'seo-audit'].includes(skillName) ? 75 : 35,
    operator: opsSkills.includes(skillName) ? 70 : 40,
    creator: creatorSkills.includes(skillName) ? 85 : 45,
    support: 20
  };
}

function yamlEscape(str) {
  // If string contains special YAML characters, use literal block scalar
  if (str.includes(':') || str.includes('-') || str.includes('"') || str.includes("'") || str.length > 100) {
    return `\n    ${str.replace(/\n/g, '\n    ')}`;
  }
  return ` ${str}`;
}

function convertFrontmatter(content, skillName) {
  // Extract existing frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return content;
  
  const [, frontmatter, body] = match;
  
  // Parse simple key:value pairs
  const lines = frontmatter.split('\n');
  let name = skillName;
  let description = '';
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      if (key === 'name') name = value;
      if (key === 'description') description = value;
    }
  }
  
  // Clean up description
  description = description.replace(/^"/, '').replace(/"$/, '');
  
  // Truncate description if too long (max 500 chars)
  if (description.length > 500) {
    description = description.substring(0, 497) + '...';
  }
  
  // Truncate summary if too long (max 120 chars)
  let summary = description;
  if (summary.length > 120) {
    summary = summary.substring(0, 117) + '...';
  }
  
  const personas = getPersonas(skillName);
  const category = CATEGORY_MAP[skillName] || 'marketing';
  
  const newFrontmatter = `---
name: ${name}
description: |
  ${description}
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: ${category}
  tags:
    - ${name}
    - marketing
  personas:
    developer: ${personas.developer}
    researcher: ${personas.researcher}
    analyst: ${personas.analyst}
    operator: ${personas.operator}
    creator: ${personas.creator}
    support: ${personas.support}
  summary: |
    ${summary}
  featured: false
  requires:
    tools: []
    mcp: []
    env: []
  author:
    name: "Corey Haines"
    url: "https://github.com/coreyhaines31"
---`;

  return newFrontmatter + '\n' + body;
}

async function fixSkill(skillName) {
  try {
    const skillFile = join(OUTPUT_DIR, skillName, 'SKILL.md');
    const content = await readFile(skillFile, 'utf-8');
    const convertedContent = convertFrontmatter(content, skillName);
    await writeFile(skillFile, convertedContent);
    console.log(`✓ ${skillName}`);
    return true;
  } catch (error) {
    console.error(`✗ ${skillName}: ${error.message}`);
    return false;
  }
}

async function main() {
  const skills = await readdir(OUTPUT_DIR);
  const marketingSkills = skills.filter(s => !['a2ui', 'ag-ui-protocol', 'calendar-weekly-planner', 'copilotkit', 'daily-standup', 'grafana-dashboards', 'honcho-memory-inspector', 'humanizer', 'inbox-zero', 'langfuse', 'meeting-follow-up', 'myah-welcome', 'receipt-organizer', 'remotion-best-practices', 'research-brief', 'sentry-feature-setup', 'sentry-fix-issues', 'sentry-otel-exporter-setup', 'sentry-python-sdk', 'sentry-sdk-setup', 'sentry-sdk-upgrade', 'sentry-setup-ai-monitoring', 'sentry-svelte-sdk', 'sveltekit-best-practices', 'test-echo', 'test-hello-world'].includes(s));
  
  console.log(`Fixing ${marketingSkills.length} marketing skills...\n`);
  
  const results = await Promise.all(marketingSkills.map(fixSkill));
  const success = results.filter(r => r).length;
  
  console.log(`\n✓ Fixed ${success}/${marketingSkills.length} skills`);
}

main().catch(console.error);
