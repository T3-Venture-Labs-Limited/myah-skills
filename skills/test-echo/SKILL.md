---
name: "Test Echo"
description: "A test skill that echoes input back with a script"
license: "MIT"
role: "assistant"
version: "1.0.0"
marketplace:
  category: "testing"
  tags:
    - "test"
    - "echo"
    - "utility"
  personas:
    developer: 70
    researcher: 40
    analyst: 60
    operator: 50
    creator: 30
    support: 40
  summary: "Test fixture skill with a script resource"
  featured: false
  requires:
    tools: []
    mcp: []
    env: []
  author:
    name: "Myah Team"
    url: "https://myah.dev"
---

# Test Echo

This test skill demonstrates rich payload installation with a script file.

## Usage

The skill echoes back whatever input you provide.

## Scripts

- `scripts/echo.sh` — A simple echo script
