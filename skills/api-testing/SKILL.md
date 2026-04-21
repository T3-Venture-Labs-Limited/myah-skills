---
name: api-testing
description: Design and run comprehensive API test suites covering happy paths, edge cases, authentication flows, and performance benchmarks. Uses a structured test pyramid approach.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: testing
  tags:
    - api
    - testing
    - http
    - integration
    - contract
    - performance
  personas:
    developer: 80
    researcher: 40
    analyst: 55
    operator: 45
    creator: 30
    support: 50
  summary: Build a test suite that gives confidence in your API's reliability and correctness
  featured: false
  requires:
    tools: [file-read, file-write, command-exec, web-search]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# API Testing

A well-tested API is one you can change with confidence. This skill
covers designing testable APIs, structuring a test suite, and automating
it in CI/CD.

## The Test Pyramid

```
        /\
       /  \     E2E Tests (few)
      /----\    — Full user flows, critical paths
     /      \
    /--------\  Integration Tests (some)
   /          \ — API endpoint + real DB
  /____________\
 /              \
/    Unit Tests   \ Many — Pure functions, isolated logic
```

Each layer catches different bugs. Unit tests are fast and plentiful.
E2E tests are slow and scarce but cover the most critical paths.

## Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   ├── order-service.test.ts
│   │   └── user-service.test.ts
│   └── utils/
│       └── validation.test.ts
├── integration/
│   ├── routes/
│   │   ├── orders.test.ts
│   │   └── users.test.ts
│   └── setup.ts
├── e2e/
│   ├── checkout.test.ts
│   └── auth-flows.test.ts
└── fixtures/
    ├── users.json
    └── orders.json
```

## Unit Tests

Test pure business logic in isolation.

```typescript
// services/discount.test.ts
import { describe, it, expect } from 'vitest';
import { calculateDiscount } from './discount';

describe('calculateDiscount', () => {
  it('applies 10% discount for orders over $100', () => {
    expect(calculateDiscount({ subtotal: 150 })).toBe(15);
  });

  it('returns 0 for orders under $100', () => {
    expect(calculateDiscount({ subtotal: 50 })).toBe(0);
  });

  it('caps discount at $50', () => {
    expect(calculateDiscount({ subtotal: 1000 })).toBe(50);
  });

  it('throws for negative subtotals', () => {
    expect(() => calculateDiscount({ subtotal: -10 }))
      .toThrow('Subtotal cannot be negative');
  });
});
```

## Integration Tests

Test the full request/response cycle with a real database.

### Setup Test Database

```typescript
// tests/integration/setup.ts
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function setupTestDB() {
  execSync('npx prisma migrate deploy', { stdio: 'ignore' });
  await prisma.$executeRaw`TRUNCATE TABLE orders, users CASCADE`;
}

export async function seedUsers() {
  return prisma.user.createMany({
    data: [
      { email: 'alice@test.com', name: 'Alice' },
      { email: 'bob@test.com', name: 'Bob' },
    ],
  });
}

export { prisma };
```

### Test HTTP Endpoints

```typescript
// tests/integration/routes/users.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestDB, seedUsers } from '../setup';

describe('GET /api/users', () => {
  beforeAll(async () => {
    await setupTestDB();
    await seedUsers();
  });

  it('returns all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({
      email: expect.any(String),
      name: expect.any(String),
    });
  });

  it('returns 401 for unauthenticated requests', async () => {
    await request(app).get('/api/users').expect(401);
  });
});

describe('POST /api/users', () => {
  it('creates a user with valid data', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'charlie@test.com', name: 'Charlie' })
      .expect(201);

    expect(res.body).toMatchObject({
      id: expect.any(Number),
      email: 'charlie@test.com',
      name: 'Charlie',
    });
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'not-an-email', name: 'Bob' })
      .expect(400);

    expect(res.body).toMatchObject({
      error: expect.stringContaining('email'),
    });
  });

  it('returns 409 for duplicate email', async () => {
    await seedUsers();
    await request(app)
      .post('/api/users')
      .send({ email: 'alice@test.com', name: 'Alice 2' })
      .expect(409);
  });
});
```

## Edge Cases to Test

### Input Validation

```typescript
// Empty strings
{ name: '' }           // 400, "name is required"
{ name: '   ' }         // 400, "name cannot be blank"

// Null/undefined
{ name: null }         // 400, "name must be a string"

// Type coercion bypass
{ userId: "1' OR 1=1--" }  // 400, validate and sanitize inputs
```

### Authentication & Authorization

```typescript
// Expired token
it('returns 401 for expired JWT', async () => {
  const expiredToken = jwt.sign({ sub: 1 }, secret, { expiresIn: '-1h' });
  await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${expiredToken}`)
    .expect(401);
});

// Wrong role
it('returns 403 when non-admin accesses admin route', async () => {
  const userToken = jwt.sign({ sub: 2, role: 'user' }, secret);
  await request(app)
    .delete('/api/users/1')
    .set('Authorization', `Bearer ${userToken}`)
    .expect(403);
});
```

### Concurrency

```typescript
it('handles race conditions on inventory', async () => {
  const product = await createProduct({ stock: 1 });

  const [res1, res2] = await Promise.all([
    request(app).post('/api/orders').send({ productId: product.id }),
    request(app).post('/api/orders').send({ productId: product.id }),
  ]);

  const successes = [res1, res2].filter(r => r.status === 201);
  const failures = [res1, res2].filter(r => r.status === 409);
  expect(successes).toHaveLength(1);
  expect(failures).toHaveLength(1);
});
```

## Contract Testing

Verify API responses match a schema.

### JSON Schema

```typescript
// schemas/user.json
{
  "type": "object",
  "required": ["id", "email", "name"],
  "properties": {
    "id": { "type": "integer" },
    "email": { "type": "string", "format": "email" },
    "name": { "type": "string", "minLength": 1 }
  }
}

// Test
import Ajv from 'ajv';
const ajv = new Ajv();
const validate = ajv.compile(userSchema);

it('response matches user schema', async () => {
  const res = await request(app).get('/api/users/1');
  const valid = validate(res.body);
  if (!valid) console.log(validate.errors);
  expect(valid).toBe(true);
});
```

## Performance Testing

### Load Test Critical Endpoints

```typescript
// tests/performance/load.test.ts
import { describe, it } from 'vitest';
import autocannon from 'autocannon';

describe('Performance', () => {
  it('GET /api/users handles 100 concurrent requests', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/api/users',
      connections: 100,
      duration: 10,
    });

    expect(result.errors).toBe(0);
    expect(result.latency.p99).toBeLessThan(500);
    expect(result.requests.average).toBeGreaterThan(100);
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run unit only
npm test -- tests/unit

# Run with coverage
npm test -- --coverage

# Run integration against a specific env
DATABASE_URL=postgresql://test:test@localhost:5432/test npm test -- tests/integration
```

## CI Integration

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test
  env:
    DATABASE_URL: postgresql://test:test@localhost:5432/test
    JWT_SECRET: test-secret
```
