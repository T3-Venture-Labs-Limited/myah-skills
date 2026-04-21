---
name: sql-optimizer
description: Improve slow SQL queries by analyzing execution plans, adding proper indexes, rewriting subqueries, and tuning database configuration. Works with PostgreSQL and MySQL.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: analytics
  tags:
    - sql
    - postgresql
    - mysql
    - database
    - performance
    - optimization
    - indexing
  personas:
    developer: 65
    researcher: 55
    analyst: 95
    operator: 50
    creator: 20
    support: 60
  summary: Make slow queries fast with execution plan analysis and strategic indexing
  featured: false
  requires:
    tools: [file-read, file-write, command-exec]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# SQL Optimizer

Slow queries are the most common cause of sluggish applications.
This skill walks through diagnosing slow queries, understanding execution plans,
and applying proven optimization techniques.

## The Optimization Workflow

1. **Identify** — Find the slow queries using logs or monitoring
2. **Analyze** — Read the execution plan to understand the approach
3. **Hypothesize** — Identify the bottleneck (scans, joins, sorts)
4. **Test** — Apply the fix and measure
5. **Deploy** — Add index, rewrite query, or tune config

## Step 1: Find Slow Queries

### PostgreSQL

```sql
-- Current running queries with duration
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  usename,
  query,
  state
FROM pg_stat_activity
WHERE state != 'idle'
  AND query_start < now() - interval '30 seconds'
ORDER BY duration DESC;

-- Top queries by total time (requires pg_stat_statements)
SELECT
  query,
  calls,
  total_exec_time / 1000 AS total_seconds,
  mean_exec_time AS avg_ms,
  rows / calls AS avg_rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

### MySQL

```sql
-- Slow query log analysis
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';

-- Current queries
SELECT * FROM information_schema.processlist
WHERE Command != 'Sleep'
ORDER BY Time DESC;

-- Table statistics
SHOW TABLE STATUS FROM mydb;
```

## Step 2: Read the Execution Plan

### PostgreSQL: EXPLAIN ANALYZE

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id;
```

**Key terms to look for:**

| Node | Good | Bad |
|---|---|---|
| **Seq Scan** | Small tables | Large tables (use index) |
| **Index Scan** | Targeted lookups | Wrong index, too many rows |
| **Bitmap Heap Scan** | Moderate selectivity | High or low selectivity |
| **Hash Join** | — | Large join inputs (try nestloop) |
| **Sort** | In-memory | Spilling to disk (add index) |
| **Nested Loop** | Small inner table | Large inner table |

### MySQL: EXPLAIN

```sql
EXPLAIN FORMAT=JSON
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id;
```

**Key columns:**

| Column | Good | Bad |
|---|---|---|
| **type** | const, eq_ref, ref | ALL (table scan) |
| **key** | Shows actual index used | NULL (no index) |
| **rows** | Low number | Thousands per table |
| **Extra** | Using index | Using temporary, filesort |

## Step 3: Apply Indexes

### Basic Index

```sql
-- Single column
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);

-- Covering index (includes all columns needed)
CREATE INDEX CONCURRENTLY idx_orders_user_id_covering
ON orders(user_id)
INCLUDE (created_at, total);
```

### Partial Index (PostgreSQL)

```sql
-- Only index active orders
CREATE INDEX CONCURRENTLY idx_orders_active
ON orders(user_id, created_at)
WHERE status = 'active';
```

### Expression Index

```sql
-- Index the lowercased email
CREATE INDEX idx_users_email_lower ON users(lower(email));

-- Use in query
SELECT * FROM users WHERE lower(email) = lower('User@Example.com');
```

### Index for LIKE Pattern

```sql
-- B-tree for prefix match
CREATE INDEX idx_products_name_prefix ON products(name text_pattern_ops);

-- Use: WHERE name LIKE 'foo%'

-- Use GIN for contains (PostgreSQL full text)
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name));
```

## Step 4: Rewrite Queries

### Avoid SELECT *

```sql
-- Bad
SELECT * FROM orders WHERE user_id = 123;

-- Good (only needed columns)
SELECT id, total, created_at FROM orders WHERE user_id = 123;
```

### Use EXISTS Instead of IN for Subqueries

```sql
-- Bad (can be slow for large subquery result)
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 100);

-- Good (stops at first match)
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total > 100
);
```

### Rewrite OR to UNION

```sql
-- Bad
SELECT * FROM products WHERE category = 'electronics' OR category = 'books';

-- Good
SELECT * FROM products WHERE category = 'electronics'
UNION ALL
SELECT * FROM products WHERE category = 'books';

-- Or use IN (often optimized well)
SELECT * FROM products WHERE category IN ('electronics', 'books');
```

### Avoid Functions on Indexed Columns

```sql
-- Bad (can't use index)
SELECT * FROM orders WHERE DATE(created_at) = '2024-03-15';

-- Good (can use index)
SELECT * FROM orders
WHERE created_at >= '2024-03-15'
  AND created_at < '2024-03-16';
```

### Use Window Functions Instead of Correlated Subqueries

```sql
-- Bad (correlated subquery runs for every row)
SELECT
  name,
  department,
  salary,
  (SELECT AVG(salary) FROM employees e2 WHERE e2.dept = e1.dept) AS dept_avg
FROM employees e1;

-- Good (window function computes once)
SELECT
  name,
  department,
  salary,
  AVG(salary) OVER (PARTITION BY department) AS dept_avg
FROM employees;
```

## Step 5: Table Maintenance

### PostgreSQL

```sql
-- Update statistics
ANALYZE orders;

-- Reclaim space and update FSM
VACUUM FULL orders;

-- Check bloat
SELECT tablename,
       pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS total,
       pg_size_pretty(pg_relation_size(tablename::regclass)) AS table_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### MySQL

```sql
-- Analyze table for better query plans
ANALYZE TABLE orders;

-- Check table size
SELECT table_name,
       ROUND(data_length / 1024 / 1024, 2) AS 'Data MB',
       ROUND(index_length / 1024 / 1024, 2) AS 'Index MB'
FROM information_schema.tables
WHERE table_schema = 'mydb'
ORDER BY (data_length + index_length) DESC;
```

## Quick Wins Checklist

- [ ] Add index on foreign keys (`user_id`, `order_id`)
- [ ] Add index on columns in WHERE with high selectivity
- [ ] Remove `SELECT *` — only fetch needed columns
- [ ] Replace `OR` with `IN` or `UNION`
- [ ] Add covering index for frequent queries
- [ ] Use `EXPLAIN ANALYZE` to verify improvement
- [ ] Update table statistics after adding indexes
