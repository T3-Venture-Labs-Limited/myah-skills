---
name: sentry-setup
description: Configure Sentry error monitoring and performance tracing for a web application. Sets up SDKs, sourcemaps, and alerting rules for Node.js, Python, and browser targets.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - sentry
    - error-monitoring
    - observability
    - debugging
    - tracing
  personas:
    developer: 90
    researcher: 40
    analyst: 60
    operator: 70
    creator: 20
    support: 80
  summary: Set up Sentry error tracking and performance monitoring for your application stack
  featured: true
  requires:
    tools: [file-read, file-write, command-exec, web-search]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Sentry Setup

Configure comprehensive error monitoring and distributed tracing with Sentry.
This skill guides you through initializing Sentry across your application stack
and establishing alert workflows.

## Prerequisites

- A Sentry account (free tier works for most use cases)
- Access to your application's source code
- At least one runtime: Node.js, Python (FastAPI/Django/Flask), or browser

## Steps

### 1. Create a Sentry Project

Navigate to [sentry.io](https://sentry.io) and create a new project for each runtime:

```
Settings → Projects → New Project → Choose your platform
```

Copy the **DSN** (Data Source Name) for each project — you'll need it below.

### 2. Install the SDK

**Node.js / TypeScript:**

```bash
npm install @sentry/node @sentry/types
```

**Python:**

```bash
pip install sentry-sdk
```

**Browser:**

```bash
npm install @sentry/browser
```

### 3. Initialize the SDK

**Node.js** (`src/instrument.ts`):

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Python** (`app/main.py`):

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastAPIIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN"),
    environment=os.getenv("ENVIRONMENT", "development"),
    integrations=[
        FastAPIIntegration(),
        StarletteIntegration(),
    ],
    traces_sample_rate=0.1,
)
```

**Browser** (`src/main.ts`):

```typescript
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.05,
});
```

### 4. Add Environment Variables

```bash
# Backend (.env)
SENTRY_DSN=https://your-dsn@sentry.io/project-number
ENVIRONMENT=production

# Frontend (.env.production)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-number
```

### 5. Configure Source Maps (Build Pipelines)

**Vite** (`vite.config.ts`):

```typescript
import { defineConfig } from 'vite';
import sentryVitePlugin from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    sentryVitePlugin({
      org: 'your-org',
      project: 'your-project',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
```

### 6. Set Up Alerts

In Sentry dashboard, configure:

1. **Error Alerts** — Notify when new issues appear (Slack, email)
2. **Performance Alerts** — Alert on p95 latency > 2s or error rate > 1%
3. **Release Health** — Track crash-free users and session data

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `SENTRY_DSN` | Backend | Sentry DSN from project settings |
| `VITE_SENTRY_DSN` | Frontend | Public DSN for browser SDK |
| `SENTRY_AUTH_TOKEN` | CI/CD | Auth token for source map uploads |
| `ENVIRONMENT` | Both | `development`, `staging`, `production` |

## Verification

Trigger a test error to verify the SDK is connected:

```bash
# Node.js
node -e "throw new Error('Sentry test error')"

# Python
python -c "raise Exception('Sentry test error')"
```

Check your Sentry dashboard — the error should appear within seconds.

## Troubleshooting

**Errors not appearing?**
- Verify the DSN matches exactly (no trailing slash)
- Check `environment` matches your filter in Sentry
- Ensure the SDK init runs before any other imports

**Source maps not uploading?**
- Confirm `SENTRY_AUTH_TOKEN` has `release:admin` scope
- Verify `sentry-cli` can authenticate: `sentry-cli whoami`

**High volume of events?**
- Lower `tracesSampleRate` to 0.01 for production
- Use `ignoreErrors` to filter known false positives
