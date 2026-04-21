---
name: react-hooks
description: Master React Hooks patterns including useState, useEffect, useCallback, useMemo, useRef, and custom hooks. Write cleaner, more performant functional components.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - react
    - hooks
    - frontend
    - state-management
    - performance
  personas:
    developer: 95
    researcher: 35
    analyst: 25
    operator: 30
    creator: 50
    support: 40
  summary: Master React Hooks patterns for cleaner functional components and better performance
  featured: false
  requires:
    tools: [file-read, file-write]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# React Hooks Mastery

Modern React development centers around hooks. This skill covers patterns for writing clean, performant hook-based components.

## useState

```typescript
const [count, setCount] = useState<number>(0);

// Object state
const [form, setForm] = useState({ name: '', email: '' });
setForm(prev => ({ ...prev, email: 'new@example.com' }));
```

## useEffect

```typescript
useEffect(() => {
  const subscription = api.subscribe(handleData);
  
  return () => subscription.unsubscribe(); // cleanup
}, [dependency]); // only re-run when dependency changes
```

### Common Patterns

```typescript
// Mount-only
useEffect(() => {
  analytics.track('page_view');
}, []);

// Data fetching
useEffect(() => {
  fetchUser(userId)
    .then(setUser)
    .catch(setError);
}, [userId]);
```

## useCallback

Memoize callbacks to prevent child re-renders:

```typescript
const handleSubmit = useCallback((data: FormData) => {
  submitForm(data);
}, [submitForm]); // only changes when submitForm changes
```

## useMemo

Memoize expensive computations:

```typescript
const sortedData = useMemo(() => {
  return expensiveSort(data, sortKey);
}, [data, sortKey]);
```

## useRef

Access DOM nodes or persist mutable values:

```typescript
const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  inputRef.current?.focus();
}, []);

const timerRef = useRef<number>(0); // survives re-renders
```

## Custom Hooks

Extract reusable logic into custom hooks:

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const debouncedSearch = useDebounce(searchTerm, 300);
```

## Rules of Hooks

1. Only call hooks at the **top level**
2. Only call hooks from **React functions** (components or custom hooks)
3. Always include dependencies in `useEffect` dependency arrays
