# Myah Skills

The Myah skill marketplace — a curated collection of Hermes agent skills. Each skill is a
SKILL.md file that defines capabilities, triggers, and behaviors for the Myah
agent runtime.

## Repository structure

```
myah-skills/
├── README.md
├── LICENSE
├── SECURITY.md
├── CATALOG_SCHEMA.md
├── catalog.json           # auto-generated — do not edit by hand
├── scripts/
│   ├── build-catalog.ts
│   └── validate-skill.ts
├── skills/
│   └── <skill-name>/
│       └── SKILL.md
└── bundles/
    └── <bundle-slug>/
        ├── bundle.yaml
        └── README.md
```

## Adding a skill

1. Create a directory under `skills/<skill-name>/`
2. Add a `SKILL.md` file following the [CATALOG_SCHEMA.md](CATALOG_SCHEMA.md)
3. Run `npm run build-catalog` to regenerate `catalog.json`
4. Commit both `SKILL.md` and `catalog.json` together
5. Submit a PR

## Updating a skill

1. Edit the relevant `skills/<skill-name>/SKILL.md`
2. Run `npm run build-catalog` to regenerate `catalog.json`
3. Commit both files together — **never commit a SKILL.md change without rebuilding the catalog**
4. Submit a PR

The platform reads `catalog.json`, not SKILL.md files directly. Skipping the rebuild means
the platform won't detect that the skill has changed and won't surface updates to users.

## Adding a bundle

1. Create a directory under `bundles/<bundle-slug>/`
2. Add `bundle.yaml` and `README.md`
3. Run `npm run build-catalog` to regenerate `catalog.json`
4. Commit both together
5. Submit a PR

## Development

```bash
npm install

# Validate all skills against the schema
npm run validate

# Rebuild catalog.json from current skill files
npm run build-catalog

# Run tests
npm test
```
