#!/usr/bin/env node
import { writeFile, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUTPUT_DIR = '/home/zac/Desktop/development/myah-skills/skills';

async function fixSkill(skillName) {
  try {
    const skillFile = join(OUTPUT_DIR, skillName, 'SKILL.md');
    const content = await readFile(skillFile, 'utf-8');
    
    // Extract the body (everything after the frontmatter)
    const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    if (!match) {
      console.error(`✗ ${skillName}: No frontmatter found`);
      return false;
    }
    
    const body = match[1];
    
    // Create clean frontmatter with proper name
    const newFrontmatter = `---
name: ${skillName}
description: |
  Marketing skill for ${skillName.replace(/-/g, ' ')}
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: marketing
  tags:
    - ${skillName}
    - marketing
  personas:
    developer: 40
    researcher: 50
    analyst: 55
    operator: 70
    creator: 80
    support: 25
  summary: |
    Marketing skill for ${skillName.replace(/-/g, ' ')}
  featured: false
  requires:
    tools: []
    mcp: []
    env: []
  author:
    name: "Corey Haines"
    url: "https://github.com/coreyhaines31"
---`;

    await writeFile(skillFile, newFrontmatter + '\n' + body);
    console.log(`✓ ${skillName}`);
    return true;
  } catch (error) {
    console.error(`✗ ${skillName}: ${error.message}`);
    return false;
  }
}

async function main() {
  const skills = await readdir(OUTPUT_DIR);
  const existingSkills = ['a2ui', 'ag-ui-protocol', 'calendar-weekly-planner', 'copilotkit', 'daily-standup', 'grafana-dashboards', 'honcho-memory-inspector', 'humanizer', 'inbox-zero', 'langfuse', 'meeting-follow-up', 'myah-welcome', 'receipt-organizer', 'remotion-best-practices', 'research-brief', 'sentry-feature-setup', 'sentry-fix-issues', 'sentry-otel-exporter-setup', 'sentry-python-sdk', 'sentry-sdk-setup', 'sentry-sdk-upgrade', 'sentry-setup-ai-monitoring', 'sentry-svelte-sdk', 'sveltekit-best-practices', 'test-echo', 'test-hello-world'];
  
  const marketingSkills = skills.filter(s => !existingSkills.includes(s));
  
  console.log(`Fixing ${marketingSkills.length} marketing skills...\n`);
  
  const results = await Promise.all(marketingSkills.map(fixSkill));
  const success = results.filter(r => r).length;
  
  console.log(`\n✓ Fixed ${success}/${marketingSkills.length} skills`);
}

main().catch(console.error);
