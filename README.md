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

## Adding a skill

1. Create a directory under `skills/<skill-name>/`
2. Add a `SKILL.md` file following the [CATALOG_SCHEMA.md](CATALOG_SCHEMA.md)
3. Run `npm run build` to regenerate `catalog.json`
4. Submit a PR

## Adding a bundle

1. Create a directory under `bundles/<bundle-slug>/`
2. Add `bundle.yaml` and `README.md`
3. Run `npm run build` to regenerate `catalog.json`
4. Submit a PR
