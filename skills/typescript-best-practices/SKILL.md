---
name: typescript-best-practices
description: Write maintainable TypeScript with strict types, generics, utility types, and modern patterns. Avoid common pitfalls and leverage advanced type system features.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - typescript
    - type-safety
    - generics
    - frontend
    - javascript
  personas:
    developer: 95
    researcher: 40
    analyst: 30
    operator: 25
    creator: 40
    support: 30
  summary: Write production-grade TypeScript with strict types, generics, and advanced patterns
  featured: false
  requires:
    tools: [file-read, file-write]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# TypeScript Best Practices

TypeScript adds static typing to JavaScript. This skill covers patterns for writing safe, maintainable TypeScript.

## Strict Mode

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## Type Inference

```typescript
// Let TypeScript infer types
const name = 'John';      // string
const count = 42;        // number
const active = true;     // boolean

// Explicit when needed
const users: string[] = [];
const settings: Record<string, unknown> = {};
```

## Union Types

```typescript
type Status = 'pending' | 'active' | 'inactive';

type User = {
  id: string;
  role: 'admin' | 'user' | 'guest';
  email: string | null;  // Can be null
};

function getStatus(status: Status): string {
  return `Current status: ${status}`;
}
```

## Interface vs Type

```typescript
// Use interface for object shapes (extensible)
interface User {
  id: string;
  name: string;
  email: string;
}

interface Admin extends User {
  permissions: string[];
}

// Use type for unions, intersections, primitives
type ID = string | number;
type ReadonlyUser = Readonly<User>;
type PartialUser = Partial<User>;
```

## Generics

```typescript
// Generic function
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

firstElement([1, 2, 3]);       // number | undefined
firstElement(['a', 'b', 'c']);  // string | undefined

// Generic interface
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
}

// Generic constraints
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

## Utility Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Partial (all optional)
type UpdateUser = Partial<User>;

// Required (all required)
type CompleteUser = Required<User>;

// Pick specific fields
type UserPreview = Pick<User, 'id' | 'name'>;

// Omit specific fields
type CreateUser = Omit<User, 'id'>;

// Record
type UserMap = Record<string, User>;

// Extract specific union members
type Admin = Extract<User['role'], 'admin'>;

// Exclude from union
type NonAdmin = Exclude<User['role'], 'admin'>;
```

## Type Guards

```typescript
// Narrowing with typeof
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase();  // string
  }
  return value.toFixed(2);  // number
}

// Custom type guard
interface Cat {
  meow(): void;
}

interface Dog {
  bark(): void;
}

function isCat(animal: Cat | Dog): animal is Cat {
  return 'meow' in animal;
}

// Assertion function
function assertIsString(val: unknown): asserts val is string {
  if (typeof val !== 'string') {
    throw new Error('Not a string!');
  }
}
```

## Async Types

```typescript
// Promise<T>
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// Awaited type
type UserPromise = Promise<User>;
type AwaitedUser = Awaited<UserPromise>;  // User

// Return type inference
async function getUser(): Promise<User> {
  return { id: '1', name: 'John', email: 'john@example.com', role: 'user' };
}
```

## Discriminated Unions

```typescript
type LoadingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };

function render(state: LoadingState) {
  switch (state.status) {
    case 'idle': return 'Ready';
    case 'loading': return 'Loading...';
    case 'success': return `Hello ${state.data.name}`;
    case 'error': return `Error: ${state.error.message}`;
  }
}
```

## Error Handling

```typescript
// Result type pattern
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      return { success: false, error: new Error('Not found') };
    }
    return { success: true, data: await response.json() };
  } catch (e) {
    return { success: false, error: e as Error };
  }
}
```

## Avoid `any`

```typescript
// Bad
function process(data: any) {
  return data.foo.bar;  // No type safety
}

// Good: unknown
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'foo' in data) {
    return (data as { foo: { bar: string } }).foo.bar;
  }
  throw new Error('Invalid data');
}

// Or use specific types
interface UserData {
  foo: { bar: string };
}

function process(data: UserData) {
  return data.foo.bar;  // Fully typed
}
```
