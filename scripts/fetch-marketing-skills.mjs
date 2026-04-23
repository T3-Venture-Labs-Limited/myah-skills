#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SKILLS = [
  'ab-test-setup', 'ad-creative', 'ai-seo', 'analytics-tracking', 'aso-audit',
  'churn-prevention', 'cold-email', 'community-marketing', 'competitor-alternatives',
  'competitor-profiling', 'content-strategy', 'copy-editing', 'copywriting',
  'customer-research', 'directory-submissions', 'email-sequence', 'form-cro',
  'free-tool-strategy', 'launch-strategy', 'lead-magnets', 'marketing-ideas',
  'marketing-psychology', 'onboarding-cro', 'page-cro', 'paid-ads',
  'paywall-upgrade-cro', 'popup-cro', 'pricing-strategy', 'product-marketing-context',
  'programmatic-seo', 'referral-program', 'revops', 'sales-enablement',
  'schema-markup', 'seo-audit', 'signup-flow-cro', 'site-architecture', 'social-content'
];

const BASE_URL = 'https://raw.githubusercontent.com/coreyhaines31/marketingskills/main/skills';
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
    const [key, ...rest] = line.split(':');
    if (key && rest.length > 0) {
      const value = rest.join(':').trim();
      if (key.trim() === 'name') name = value;
      if (key.trim() === 'description') description = value;
    }
  }
  
  // Truncate description if too long (max 500 chars)
  if (description.length > 500) {
    description = description.substring(0, 497) + '...';
  }
  
  const personas = getPersonas(skillName);
  const category = CATEGORY_MAP[skillName] || 'marketing';
  
  const newFrontmatter = `---
name: ${name}
description: "${description.replace(/"/g, '\\"')}"
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
  summary: "${description.length > 120 ? description.substring(0, 117) + '...' : description}"
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

async function fetchSkill(skillName) {
  try {
    const url = `${BASE_URL}/${skillName}/SKILL.md`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch ${skillName}: ${response.status}`);
      return false;
    }
    
    const content = await response.text();
    const convertedContent = convertFrontmatter(content, skillName);
    
    const skillDir = join(OUTPUT_DIR, skillName);
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, 'SKILL.md'), convertedContent);
    
    console.log(`✓ ${skillName}`);
    return true;
  } catch (error) {
    console.error(`✗ ${skillName}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`Fetching ${SKILLS.length} marketing skills...\n`);
  
  const results = await Promise.all(SKILLS.map(fetchSkill));
  const success = results.filter(r => r).length;
  
  console.log(`\n✓ Fetched ${success}/${SKILLS.length} skills`);
}

main().catch(console.error);
