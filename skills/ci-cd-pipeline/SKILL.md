---
name: ci-cd-pipeline
description: Build continuous integration and deployment pipelines with automated testing, container builds, and staged rollouts. Implement GitHub Actions workflows for modern DevOps.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - ci-cd
    - github-actions
    - automation
    - devops
    - deployment
  personas:
    developer: 70
    researcher: 25
    analyst: 20
    operator: 95
    creator: 20
    support: 35
  summary: Build CI/CD pipelines with automated testing, container builds, and staged rollouts
  featured: false
  requires:
    tools: [command-exec, file-read, file-write]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# CI/CD Pipeline Design

Continuous Integration and Deployment automates your path from code to production.

## GitHub Actions Basics

```yaml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
```

## Multi-Stage Pipeline

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  # Stage 1: Test
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      - run: npm run lint

  # Stage 2: Build
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t myapp:${{ github.sha }} .
      - run: docker push ghcr.io/myorg/myapp:${{ github.sha }}

  # Stage 3: Deploy Staging
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - run: kubectl apply -f k8s/staging/ --token ${{ secrets.KUBE_TOKEN }}

  # Stage 4: Deploy Production
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: kubectl apply -f k8s/production/ --token ${{ secrets.KUBE_TOKEN }}
```

## Matrix Builds

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test
```

## Caching Dependencies

```yaml
steps:
  - uses: actions/checkout@v4
  
  - uses: actions/cache@v4
    with:
      path: |
        ~/.npm
        node_modules
      key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
  
  - run: npm ci
```

## Docker Build with Cache

```yaml
- name: Build Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ghcr.io/myorg/myapp:${{ github.sha }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

## Environment Protection

```yaml
deploy-production:
  needs: deploy-staging
  runs-on: ubuntu-latest
  environment:
    name: production
    url: https://app.example.com
    # Requires manual approval
    protected: true
```

## Secrets Management

```yaml
steps:
  - name: Deploy to cloud
    env:
      API_KEY: ${{ secrets.API_KEY }}
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    run: |
      aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
      ./deploy.sh
```

## Conditional Execution

```yaml
jobs:
  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
```

## Notifications

```yaml
- name: Notify Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    channel-id: 'deployments'
    slack-message: "Deploy failed: ${{ github.repository }} ${{ github.run_id }}"
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
```

## Best Practices

1. **Fail fast** — run fastest tests first
2. **Cache dependencies** — speed up builds
3. **Use matrix strategy** — test across versions
4. **Parallelize** — independent jobs run concurrently
5. **Keep secrets secure** — use GitHub secrets
6. **Idempotent deploys** — running twice should be safe
7. **Add health checks** — verify deployment success
