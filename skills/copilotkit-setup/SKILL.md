---
name: copilotkit-setup
description: Integrate CopilotKit to add AI-powered autocomplete and contextual assistance to any React application. Covers installation, component wiring, and custom action handlers.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - copilotkit
    - ai
    - react
    - autocomplete
    - copilot
  personas:
    developer: 85
    researcher: 35
    analyst: 30
    operator: 45
    creator: 70
    support: 40
  summary: Add AI-powered autocomplete and contextual copilot assistance to your React app
  featured: true
  requires:
    tools: [file-read, file-write, command-exec, web-search]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# CopilotKit Setup

Add AI copilot capabilities to your React application with CopilotKit.
This skill sets up the provider, copilot UI components, and custom action handlers
so your users get contextual AI assistance inline.

## What You Get

- **Inline autocomplete** suggestions as users type
- **Copilot chat panel** for free-form AI assistance
- **Action targets** — specific UI elements the AI can read and modify
- **Custom skills** — teach the AI to perform domain-specific tasks

## Prerequisites

- React 18+ or Next.js 13+ (App Router)
- Node.js 18+
- An AI backend (OpenAI, Anthropic, or local model via LM Studio)

## Installation

```bash
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/react-api
```

## Basic Setup

### 1. Wrap Your App with CopilotKit

**Next.js App Router** (`app/layout.tsx`):

```tsx
import { CopilotProvider } from '@copilotkit/react-core';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CopilotProvider
          chatApiEndpoint="/api/copilotkit"
          defaultModel="gpt-4o"
        >
          {children}
        </CopilotProvider>
      </body>
    </html>
  );
}
```

**Create the API route** (`app/api/copilotkit/route.ts`):

```typescript
import { CopilotAPI } from '@copilotkit/react-api';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const copilotkit = new CopilotAPI({ openai });

export async function POST(req: Request) {
  return copilotkit.streamResponse(req);
}
```

### 2. Add the Copilot UI

**Global floating button** (`app/page.tsx`):

```tsx
'use client';

import { CopilotKit } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';

export default function HomePage() {
  return (
    <main>
      <h1>My App</h1>
      {/* Your page content */}
      <CopilotKit>
        <CopilotSidebar
          defaultOpen={false}
          labels={{ open: 'Open Copilot', closed: 'Close Copilot' }}
        />
      </CopilotKit>
    </main>
  );
}
```

## Action Targets (Interactive UI Elements)

Mark any component as something the AI can read and modify:

```tsx
'use client';

import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core';

export function TaskList({ tasks }: { tasks: Task[] }) {
  useCopilotReadable({
    description: 'Current task list',
    value: tasks,
  });

  useCopilotAction({
    name: 'addTask',
    description: 'Add a new task to the list',
    parameters: {
      title: { type: 'string', description: 'The task title' },
    },
    handler: async ({ title }) => {
      await addTask(title);
    },
  });

  return (/* render tasks */);
}
```

## Custom Skills

Define domain-specific actions the AI can perform:

```typescript
const skills: CopilotSkill[] = [
  {
    name: 'createInvoice',
    description: 'Create an invoice for a customer',
    parameters: z.object({
      customerId: z.string(),
      amount: z.number(),
      items: z.array(z.object({ description: z.string(), quantity: z.number() })),
    }),
    handler: async (params) => {
      const invoice = await billingService.createInvoice(params);
      return { invoiceId: invoice.id, total: invoice.total };
    },
  },
];
```

Pass skills to the provider:

```tsx
<CopilotProvider skills={skills}>
  {children}
</CopilotProvider>
```

## Styling the Copilot UI

The default styles work out of the box. To customize:

```css
:root {
  --copilot-kit-primary: #DF3377;
  --copilot-kit-background: #ffffff;
  --copilot-kit-separator: #DEE2DE;
}
```

## Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | API key for your AI backend |

## Verification

1. Start your dev server: `npm run dev`
2. Click the floating copilot button
3. Ask: "What can you help me with?"
4. The AI should respond with context-aware suggestions

## Troubleshooting

**Copilot not appearing?**
- Verify `CopilotProvider` wraps your entire app
- Check browser console for errors
- Confirm API route returns streaming responses

**AI not seeing my app state?**
- Add `useCopilotReadable` to components with relevant state
- Ensure the state is serializable (no functions or class instances)

**Actions not executing?**
- Actions must be wrapped in `'use client'` components
- Parameters must have JSDoc descriptions for the AI to understand them
