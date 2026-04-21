---
name: git-workflow
description: Automate common Git workflows including branch creation, commit messaging, interactive rebasing, and release tagging. Enforces conventional commits and keeps your history clean.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - git
    - commits
    - branching
    - conventional-commits
    - release
  personas:
    developer: 95
    researcher: 30
    analyst: 20
    operator: 60
    creator: 40
    support: 25
  summary: Automate Git branch, commit, and release workflows with conventionalcommits enforcement
  featured: false
  requires:
    tools: [command-exec, file-read]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Git Workflow Automation

Automate repetitive Git tasks with sensible defaults that keep your repository history clean and meaningful.

## Conventional Commits

This skill enforces the Conventional Commits specification:

```
<type>(<scope>): <subject>

types: feat | fix | docs | style | refactor | test | chore | perf | ci
scope: optional, lowercase (e.g., auth, ui, api)
subject: imperative mood, no period, max 72 chars
```

### Quick Commit

```bash
git add .
git commit -m "feat(auth): add OAuth2 login flow"
```

### Commit with Scope

```bash
git commit -m "fix(api): handle null response from payment gateway"
```

## Branch Workflow

### Feature Branch

```bash
git checkout -b feat/T3-123-add-dark-mode
```

### Bugfix Branch

```bash
git checkout -b fix/T3-456-login-redirect-loop
```

### Release Branch

```bash
git checkout -b release/v1.2.0
```

## Interactive Rebase

Clean up commits before code review:

```bash
git rebase -i HEAD~5
```

Commands:
- `pick` — keep commit
- `squash` — merge into previous
- `reword` — change message
- `drop` — remove commit

## Release Tagging

```bash
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

## Undo Operations

### Uncommit (keep changes staged)

```bash
git reset --soft HEAD~1
```

### Uncommit (keep changes unstaged)

```bash
git reset HEAD~1
```

### Completely undo (DISCARD changes)

```bash
git reset --hard HEAD~1
```

## Tips

- Write commit messages that explain **why**, not what
- Squash WIP commits before PR review
- Use `git log --oneline --graph` for visual history
- Always pull with `--rebase` on feature branches: `git pull --rebase origin main`
