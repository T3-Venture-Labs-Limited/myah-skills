# Pull Request Checklist

## Pre-merge requirements

- [ ] All 3 automated security checks pass (Gen Agent Trust Hub, Socket, Snyk)
- [ ] `SKILL.md` or `bundle.yaml` validates against `CATALOG_SCHEMA.md`
- [ ] No new external dependencies introduced without prior approval
- [ ] No credentials, tokens, or secrets committed
- [ ] `catalog.json` is updated if the change adds or modifies a skill or bundle
- [ ] Skill does not override Hermes built-in primitives without explicit documentation
- [ ] Bundle member skills are mutually compatible
- [ ] Reviewer has tested the skill locally or in a test environment

## Skill-specific checks

- [ ] Frontmatter fields (`name`, `description`, `version`, `license`) are complete
- [ ] Skill triggers and conditions are clearly defined in the body
- [ ] Any `scripts/` or `resources/` paths are valid relative paths
- [ ] Skill is compatible with the current Hermes agent version pinned in Myah
