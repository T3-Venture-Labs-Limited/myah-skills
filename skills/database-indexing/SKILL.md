---
name: database-indexing
description: Optimize database performance through proper indexing strategies. Create and maintain indexes for PostgreSQL and MySQL, analyze query plans, and avoid common indexing mistakes.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - database
    - postgresql
    - mysql
    - indexing
    - performance
    - sql
  personas:
    developer: 80
    researcher: 45
    analyst: 50
    operator: 60
    creator: 15
    support: 55
  summary: Optimize database performance with proper indexing strategies and query analysis
  featured: false
  requires:
    tools: [command-exec, file-read]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Database Indexing

Proper indexes can make queries 100x faster. This skill covers index strategies for PostgreSQL and MySQL.

## Index Types

| Type | Use Case | Overhead |
|------|----------|----------|
| B-tree | Equality, range queries | Low |
| Hash | Equality only | Low |
| GIN | JSON, arrays, full-text | Higher |
| GiST | Geometric, range types | Higher |
| Partial | Subset of rows | Low |
| Composite | Multi-column | Medium |

## Basic Index Creation

### PostgreSQL

```sql
-- Single column
CREATE INDEX idx_users_email ON users(email);

-- Composite (order matters!)
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);

-- Unique
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Partial
CREATE INDEX idx_active_users ON users(email) WHERE active = true;
```

### MySQL

```sql
-- Same syntax, InnoDB uses B-tree by default
CREATE INDEX idx_users_email ON users(email);

-- Full-text
ALTER TABLE articles ADD FULLTEXT INDEX idx_content (title, body);
```

## Query Analysis

### PostgreSQL EXPLAIN

```sql
EXPLAIN ANALYZE
SELECT * FROM orders
WHERE user_id = 123
AND created_at > '2024-01-01'
ORDER BY created_at DESC;
```

Output shows:
- `Seq Scan` = full table scan (bad)
- `Index Scan` = using index (good)
- `Index Only Scan` = data from index alone (best)

### Reading EXPLAIN

```
Index Scan using idx_orders_user_date on orders  (cost=0.43..8.45 rows=1 width=150)
  Index Cond: ((user_id = 123) AND (created_at > '2024-01-01'::date))
  ->  Btree Scan on orders  (actual time=0.012..0.015 rows=5 loops=1)
```

## Index Design Principles

### DO: Index Foreign Keys

```sql
-- Always index foreign keys for JOIN performance
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

### DO: Index WHERE Clauses

```sql
-- Index columns used in WHERE
CREATE INDEX idx_users_status ON users(status) WHERE status != 'deleted';
```

### DON'T: Index Low-Selectivity Columns

```sql
-- Bad: boolean column (only 2 values)
CREATE INDEX idx_users_is_active ON users(is_active);  -- rarely helps

-- Good: combined with high-selectivity column
CREATE INDEX idx_users_status_email ON users(status, email);
```

### DO: Order Composite Indexes Wisely

```sql
-- For queries: WHERE status = 'active' AND email = 'x'
-- Put equality columns first, range last
CREATE INDEX idx_users_status_email ON users(status, email);

-- For queries: WHERE status = 'active' ORDER BY created_at
-- Equality first, then sort column
CREATE INDEX idx_users_status_created ON users(status, created_at DESC);
```

## Index Maintenance

### PostgreSQL

```sql
-- Reindex to reclaim space and fix bloat
REINDEX INDEX idx_users_email;

-- Concurrent reindex (no lock)
REINDEX INDEX CONCURRENTLY idx_users_email;

-- Check index usage
SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Find Unused Indexes

```sql
-- PostgreSQL: indexes never used
SELECT
    schemaname || '.' || relname AS table,
    indexrelname AS index,
    pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size
FROM pg_stat_user_indexes u
JOIN pg_index i ON i.indexrelid = u.indexrelid
WHERE idx_scan = 0
AND NOT indisunique
ORDER BY pg_relation_size(i.indexrelid) DESC;
```

## Partial Indexes

```sql
-- Only index active orders (smaller, faster)
CREATE INDEX idx_active_orders ON orders(user_id, created_at)
WHERE status = 'active';

-- Use case: most queries filter by status
SELECT * FROM orders
WHERE status = 'active' AND user_id = 123;
```

## Covering Indexes

```sql
-- Include all columns needed to avoid table lookup
CREATE INDEX idx_orders_covering ON orders(user_id)
INCLUDE (created_at, total_amount, status);

-- Query can be satisfied entirely from index
SELECT created_at, total_amount
FROM orders
WHERE user_id = 123;
```

## JSON Indexing (PostgreSQL)

```sql
-- GIN index for JSON containment
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- Query using JSON operators
SELECT * FROM products
WHERE tags @> ['electronics', 'sale'];
```

## Best Practices

1. **Index early, measure before and after**
2. **Monitor query performance over time**
3. **Drop unused indexes** (they slow writes)
4. **Use partial indexes** when appropriate
5. **Keep statistics up to date**: `ANALYZE table_name;`
6. **Consider covering indexes** for frequent queries
7. **Test with production data volume**

## Common Mistakes

```sql
-- Mistake 1: Function on indexed column
-- Bad
CREATE INDEX idx_users_lower_email ON users(lower(email));
WHERE lower(email) = 'john@example.com'

-- Good: Use expression index
CREATE INDEX idx_users_email_lower ON users((lower(email)));
WHERE lower(email) = 'john@example.com'

-- Mistake 2: Leading wildcard
-- Bad (can't use B-tree)
WHERE email LIKE '%@example.com'

-- Good: Consider full-text search or trigram index
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_users_email_trgm ON users USING gin(email gin_trgm_ops);
```
