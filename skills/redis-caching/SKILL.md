---
name: redis-caching
description: Implement Redis caching strategies including cache-aside, write-through, session storage, and distributed locks. Optimize application performance with proper TTL and eviction policies.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - redis
    - caching
    - performance
    - sessions
    - distributed-systems
  personas:
    developer: 80
    researcher: 35
    analyst: 45
    operator: 60
    creator: 20
    support: 40
  summary: Redis caching patterns for improving application performance and scalability
  featured: false
  requires:
    tools: [command-exec, file-read]
    mcp: []
    env: [REDIS_URL]
  author:
    name: Myah Team
    url: https://myah.dev
---

# Redis Caching Strategies

Redis is an in-memory data store that excels at caching, session management, and pub/sub messaging.

## Connection

```python
import redis

r = redis.from_url(os.environ.get('REDIS_URL', 'redis://localhost:6379/0'))

# Or with connection pool
pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
r = redis.Redis(connection_pool=pool)
```

## Cache-Aside Pattern

The application checks cache first, falls back to DB, then populates cache:

```python
def get_user(user_id):
    cache_key = f"user:{user_id}"
    
    # Try cache first
    cached = r.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Fall back to database
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)
    
    # Populate cache with TTL
    if user:
        r.setex(cache_key, 3600, json.dumps(user))  # 1 hour TTL
    
    return user
```

## Write-Through Pattern

Write to cache and DB simultaneously:

```python
def update_user(user_id, data):
    cache_key = f"user:{user_id}"
    
    # Update database first
    db.execute("UPDATE users SET ... WHERE id = ?", user_id, data)
    
    # Invalidate cache (next read will repopulate)
    r.delete(cache_key)
    
    # Or write-through: r.setex(cache_key, 3600, json.dumps(data))
```

## Session Storage

```python
from uuid import uuid4
import datetime as dt

def create_session(user_id):
    session_id = str(uuid4())
    session_key = f"session:{session_id}"
    
    r.hset(session_key, mapping={
        'user_id': user_id,
        'created_at': dt.datetime.utcnow().isoformat()
    })
    r.expire(session_key, 86400 * 7)  # 7 days
    
    return session_id

def get_session(session_id):
    session_key = f"session:{session_id}"
    return r.hgetall(session_key)
```

## Distributed Locks

```python
import time

def acquire_lock(lock_name, timeout=10):
    lock_key = f"lock:{lock_name}"
    lock_value = str(time.time())
    
    if r.set(lock_key, lock_value, nx=True, ex=timeout):
        return lock_value
    return None

def release_lock(lock_name, lock_value):
    lock_key = f"lock:{lock_name}"
    
    # Only release if we own the lock
    current = r.get(lock_key)
    if current == lock_value:
        r.delete(lock_key)
        return True
    return False

# Usage
def process_with_lock(resource_id):
    lock_val = acquire_lock(resource_id)
    if not lock_val:
        raise Exception("Could not acquire lock")
    
    try:
        # Critical section
        return do_work(resource_id)
    finally:
        release_lock(resource_id, lock_val)
```

## Caching Collections

```python
# Cache a list with TTL
def cache_query_results(query, results):
    cache_key = f"query:{hash(query)}"
    r.setex(cache_key, 300, json.dumps(results))  # 5 min TTL

# Sorted sets for leaderboards
def add_score(player_id, score):
    r.zadd('leaderboard', {player_id: score})

def get_top_players(n=10):
    return r.zrevrange('leaderboard', 0, n-1, withscores=True)
```

## Eviction Policies

| Policy | Description |
|--------|-------------|
| `noeviction` | Return error when memory limit reached |
| `allkeys-lru` | Evict least recently used keys |
| `volatile-lru` | Evict LRU keys with TTL set |
| `allkeys-random` | Randomly evict any key |
| `volatile-ttl` | Evict keys with shortest TTL |

Set in `redis.conf` or at runtime:

```python
r.config_set('maxmemory-policy', 'allkeys-lru')
```
