# Security Policy

## Reporting a vulnerability

If you discover a security issue in this repository or in any skill it
distributes, please email `security@myah.dev` with details and a
proof-of-concept. Do not open a public issue. We aim to acknowledge reports
within 2 business days.

## Supported versions

| Version | Supported |
|---------|-----------|
| `main`  | Yes       |

Older commits are not patched. The marketplace always pulls the catalog from
the latest `main`.

## How skills are vetted

Skills enter the marketplace through one of two paths, each with its own
audit pipeline.

### Internal skills (`skills/`)

Authored in this repository. Every PR that touches `skills/**`,
`semgrep-rules/**`, or `scripts/audits/**` triggers the **Security Audit**
workflow (`.github/workflows/audit.yml`), which runs three checks per
modified skill:

| Check | Tool | Blocks merge |
|-------|------|--------------|
| Secret scan | [TruffleHog](https://github.com/trufflesecurity/trufflehog) — scans for verified API keys, tokens, and credentials | **Yes** if any verified secret is found |
| Safety scan | [Semgrep](https://semgrep.dev) using the rules in `semgrep-rules/myah-agent-safety.yml` (shell injection, dangerous `eval`, unsafe deserialization, system-dir writes, etc.) | **Yes** if any `ERROR`-severity finding |
| Dependency audit | `pip-audit` and `npm audit` (only if a skill ships its own deps) | No — informational only |

Results are aggregated by `scripts/audits/aggregate-results.ts` and posted
back to the PR as a comment. Per-skill results are also persisted to
`audit-results/<slug>.json` on every push to `main` by the **Publish Security
Audits** workflow.

### External skills (`external/`)

Curated entries sourced from [skills.sh](https://skills.sh). These are not
re-scanned in our CI — instead, the upstream registry's audit results are
recorded in each skill's `external/<slug>/skill.yaml` under `external_audit`,
covering three checks performed by skills.sh:

- **Gen Agent Trust Hub** — capability claim verification
- **Socket** — supply-chain analysis
- **Snyk** — CVE and license scan

`scripts/build-catalog.ts` excludes any external entry where any of the three
checks has `status: fail`. Entries with `warn` are included; entries with
`pass` everywhere are surfaced as fully clean.

## Reviewer checklist

Before approving a PR that adds or modifies a skill or bundle:

- [ ] All Security Audit checks pass (visible as a PR comment)
- [ ] `SKILL.md` or `bundle.yaml` validates against `CATALOG_SCHEMA.md` (`npm run validate`)
- [ ] No new external dependencies added without prior approval
- [ ] No Hermes built-in primitives are overridden without explicit documentation
- [ ] Bundle member skills are mutually compatible
- [ ] No credentials, tokens, or secrets embedded in skill content (TruffleHog catches verified ones; eyeball the diff for placeholder-shaped secrets too)
