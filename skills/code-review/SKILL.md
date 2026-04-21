---
name: code-review
description: Conduct thorough and constructive code reviews that catch bugs, share knowledge, and improve codebase quality. Covers review checklists, feedback techniques, and common pitfalls to catch.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - code-review
    - quality
    - testing
    - security
    - best-practices
    - collaboration
  personas:
    developer: 95
    researcher: 50
    analyst: 60
    operator: 30
    creator: 50
    support: 40
  summary: Review code that catches bugs, shares knowledge, and raises the bar for everyone
  featured: true
  requires:
    tools: [file-read, file-write, command-exec]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Code Review

A good code review is a conversation, not a judgment. The goal is to ship
better code together — catching bugs, spreading knowledge, and maintaining
shared standards. This skill covers what to look for, how to give feedback,
and how to handle the review process.

## The Review Mindset

**You're helping, not auditing.**
Your job is to make the author successful, not to demonstrate superiority.

**Separate the critical from the cosmetic.**
If you comment on every minor style issue, important feedback gets lost.

**Be explicit about severity:**
- 🔴 `blocking` — Must fix before merge
- 🟡 `suggestion` — Consider this, but author's call
- 🟢 `nit` — Minor style/preference, take it or leave it

## What to Review

### Correctness

```typescript
// Does the logic do what the PR claims?
// Are edge cases handled?
// Does it handle empty/null/undefined inputs?

// Example: Off-by-one error
function getPage(items: Item[], page: number) {
  const pageSize = 10;
  const start = page * pageSize;  // Bug: should be (page - 1) * pageSize
  return items.slice(start, start + pageSize);
}
```

### Security

```typescript
// SQL injection
// Look for: string concatenation in queries
const query = `SELECT * FROM users WHERE id = ${userId}`;  // BAD
const query = 'SELECT * FROM users WHERE id = $1';         // GOOD (parameterized)

// XSS
// Look for: innerHTML, dangerouslySetInnerHTML, template strings with user input
element.innerHTML = userInput;  // BAD
element.textContent = userInput; // GOOD

// Authentication/authorization
// Is the user actually verified before sensitive operations?
async function deleteAccount(req: Request) {
  // Bug: no auth check
  await db.account.delete({ where: { id: req.params.id } });
}
```

### Error Handling

```typescript
// Silent failures
try {
  await sendEmail(user.email);
} catch (e) {
  // Bug: swallowing error
}

// Good: at minimum, log it
try {
  await sendEmail(user.email);
} catch (e) {
  logger.error('Failed to send email', { userId: user.id, error: e });
}

// Best: retry or queue for later
```

### Performance

```typescript
// N+1 query problem
// Look for: loops that query the database
for (const order of orders) {
  const user = await db.user.findUnique({ where: { id: order.userId } });
  // Bug: queries DB for each order
}

// Better: batch query
const userIds = [...new Set(orders.map(o => o.userId))];
const users = await db.user.findMany({ where: { id: { in: userIds } } });
```

### Type Safety

```typescript
// Avoid any — use unknown or proper types
async function parseUserInput(input: any) {  // BAD
  return JSON.parse(input);
}

// Better
async function parseUserInput(input: string) {
  try {
    return JSON.parse(input) as UserInput;
  } catch {
    throw new Error('Invalid JSON');
  }
}

// Missing null checks
function getUsername(user?: User) {
  return user.name;  // Bug: user could be undefined
  return user?.name ?? 'Anonymous'; // Good
}
```

## Review Checklist

### Before You Start

- [ ] I understand the goal of this change
- [ ] I've read the associated ticket/issue
- [ ] I've looked at any new files holistically first

### Logic & Correctness

- [ ] The change does what it claims
- [ ] Edge cases are handled (empty, null, zero, negative)
- [ ] Loops terminate correctly
- [ ] Async operations are awaited properly
- [ ] No infinite loops or recursion without safeguards

### Security

- [ ] User input is validated and sanitized
- [ ] SQL queries use parameterization
- [ ] Authentication is checked where needed
- [ ] Authorization checks are at the right level
- [ ] Secrets aren't logged or exposed

### Error Handling

- [ ] Errors are caught and handled meaningfully
- [ ] Errors are logged with enough context
- [ ] Errors propagate correctly (not silently swallowed)
- [ ] Cleanup runs (finally blocks, await in catch)

### Testing

- [ ] New functionality has tests
- [ ] Tests cover edge cases
- [ ] Tests assert behavior, not implementation
- [ ] The PR doesn't break existing tests

### Performance

- [ ] No obvious N+1 queries
- [ ] No blocking operations in hot paths
- [ ] Large data processed in chunks or streams
- [ ] Expensive operations are cached where appropriate

### Code Quality

- [ ] Functions are small and do one thing
- [ ] Names are clear and consistent
- [ ] Comments explain *why*, not *what*
- [ ] No commented-out dead code
- [ ] No obvious code duplication

## How to Write Feedback

### Instead of "This is wrong" try:

> "This could cause a crash if `user` is null. Consider adding a null check or using `user?.name ?? 'Anonymous'`."

### Instead of "You should use X" try:

> "Have you considered using a Map here instead of an object? It would give O(1) lookups and handle any key type."

### Instead of "This is a mess" try:

> "This function is doing a lot. Could we split it up? Maybe extract the validation into its own function?"

### Always explain the *why*:

> "This matters because if `orders` is empty, `reduce` will throw. The `?? []` fallback handles that case."

## Handling Pushback

**Author disagrees with your comment:**
> "I see your point. The reason I did it this way is [reason]. Does that change your assessment?"

**You're not sure if it's blocking:**
> "Not blocking, but I'm curious — why did you choose X over Y?"

**The code is outside the PR scope:**
> "Not for this PR, but consider [improvement] when you have time."

## Automation: What to Let CI Handle

Don't waste review time on:
- Formatting/linting (automate with Prettier, ESLint)
- Type errors (automate with TypeScript/tsc)
- Missing tests (automate with coverage tools)
- Dead code detection (SonarQube, etc.)

Focus your human attention on:
- Logic correctness
- Security implications
- Architectural fit
- Knowledge sharing

## Review Turnaround

- **Within 24 hours** — Authors shouldn't wait days for feedback
- **Async by default** — Comments in the PR, not a meeting
- **Pair program for complex changes** — If a PR needs extensive discussion, a quick call is often faster

## Giving Positive Feedback

Don't just point out problems. Acknowledge what's good:

> "Great approach with the cursor pagination — handles large datasets much better than offset."

> "I like that you added the JSDoc comments. Made reviewing this much easier."

Good feedback builds trust and encourages the author to keep up good practices.
