# Myah Skills

The Myah skill marketplace — a curated collection of Hermes agent skills. Each skill is a
SKILL.md file that defines capabilities, triggers, and behaviors for the Myah
agent runtime.

**Design spec:** [Skill Marketplace Design](https://github.com/T3-Venture-Labs-Limited/myah/blob/master/docs/superpowers/specs/2026-04-21-skill-marketplace-design.md)
**Implementation plan:** (link to be added once created)

## Repository structure

```
myah-skills/
├── README.md
├── LICENSE
├── SECURITY.md
├── CATALOG_SCHEMA.md
├── scripts/
│   ├── build-catalog.ts
│   └── validate-skill.ts
├── skills/
│   └── <skill-name>/
│       └── SKILL.md
├── bundles/
│   └── <bundle-slug>/
│       ├── bundle.yaml
│       └── README.md
└── catalog.json
```

## Skill format

Skills are YAML-frontmatter Markdown files. See `CATALOG_SCHEMA.md` for the
full schema.

## Contribution model

v1 is Myah-curated only (PR-based, Myah team merges). Every skill must pass
the 3-check audit pipeline before merge.

## Security

See `SECURITY.md` for the audit pipeline and reviewer checklist.
