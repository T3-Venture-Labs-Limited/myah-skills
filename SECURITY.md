# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| main    | Yes       |

## 3-check audit pipeline

Every skill and bundle merged into this repository must pass three automated
security checks. PRs that fail any check are blocked until resolved.

### 1. Gen Agent Trust Hub

Scans skill metadata and behavior definitions for policy violations.
Blocked issues: skill claiming capabilities it does not have, or misrepresenting
Hermes primitives.

### 2. Socket

Dependency vulnerability and supply-chain scan. Runs on all `scripts/` and
any embedded dependencies in skill resources.

### 3. Snyk

CVE and license compliance scan. Every dependency must resolve to a known-safe
version with an OSI-approved license.

## Reviewer checklist

- [ ] Skill passes all three automated checks (visible in PR status)
- [ ] SKILL.md frontmatter validates against `CATALOG_SCHEMA.md`
- [ ] Skill does not introduce new external dependencies without prior approval
- [ ] Skill does not override Hermes built-in primitives without documentation
- [ ] Bundle member skills are all mutually compatible
- [ ] No credentials, tokens, or secrets embedded in skill content
