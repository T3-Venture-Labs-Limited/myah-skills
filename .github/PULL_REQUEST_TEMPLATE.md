# Pull Request Checklist

## Pre-merge requirements

- [ ] All automated security checks pass (see details below)
- [ ] `SKILL.md` or `bundle.yaml` validates against `CATALOG_SCHEMA.md`
- [ ] No credentials, tokens, or secrets committed
- [ ] `catalog.json` is updated if the change adds or modifies a skill or bundle
- [ ] Skill does not override Hermes built-in primitives without explicit documentation
- [ ] Bundle member skills are mutually compatible

## Security checks (run automatically on PR)

The following checks run on every PR that touches `skills/**`:

| Check | Tool | Blocking |
|-------|------|----------|
| Secret Scan | TruffleHog | **Yes** — verified secrets block merge |
| Safety Check | Semgrep | **Yes** — ERROR severity findings block merge |
| Dependencies | npm audit / pip-audit | No — warnings only |

Results are posted as a PR comment by the audit bot.

## Skill-specific checks

- [ ] Frontmatter fields (`name`, `description`, `version`, `license`) are complete
- [ ] `marketplace:` block includes `category`, `tags`, `personas`, `summary`, `author`
- [ ] All 6 persona axes are defined (developer, researcher, analyst, operator, creator, support)
- [ ] Skill triggers and conditions are clearly defined in the body
- [ ] Any `scripts/` or `resources/` paths are valid relative paths
- [ ] Skill is compatible with the current Hermes agent version pinned in Myah

## For skill imports (external repos)

- [ ] Source repo has an open-source license compatible with Myah's marketplace
- [ ] Attribution includes original author name and URL
- [ ] No vendor-specific branding or hardcoded URLs that would break for other users
