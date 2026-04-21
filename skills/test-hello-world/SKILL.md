---
name: "Test Hello World"
description: "A simple greeting skill for testing the marketplace pipeline"
license: "MIT"
role: "assistant"
version: "1.0.0"
marketplace:
  category: "testing"
  tags:
    - "test"
    - "hello"
    - "greeting"
  personas:
    developer: 50
    researcher: 30
    analyst: 20
    operator: 40
    creator: 60
    support: 70
  summary: "Test fixture skill that greets the user"
  featured: false
  requires:
    tools: []
    mcp: []
    env: []
  author:
    name: "Myah Team"
    url: "https://myah.dev"
---

# Test Hello World

This is a test skill for verifying the marketplace pipeline. It simply greets the user.

## Usage

Say "hello" and the skill will respond with a friendly greeting.

## Example

User: "Hello!"
Assistant: "Hello there! Welcome to Myah. How can I help you today?"
