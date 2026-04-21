---
name: api-rate-limiting
description: Implement API rate limiting to protect services from abuse and ensure fair resource usage. Use token bucket, sliding window, and fixed window algorithms with Redis or in-memory stores.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - api
    - rate-limiting
    - security
    - redis
    - middleware
  personas:
    developer: 85
    researcher: 35
    analyst: 25
    operator: 60
    creator: 15
    support: 45
  summary: Implement API rate limiting with token bucket, sliding window, and Redis-backed algorithms
  featured: false
  requires:
    tools: [file-read, file-write, command-exec]
    mcp: []
    env: [REDIS_URL]
  author:
    name: Myah Team
    url: https://myah.dev
---

# API Rate Limiting

Protect your APIs from abuse and ensure fair usage with rate limiting.

## Algorithms

### Token Bucket

Tokens accumulate at a steady rate. Each request consumes a token.

```python
import time
from threading import Lock

class TokenBucket:
    def __init__(self, rate: float, capacity: int):
        self.rate = rate  # tokens per second
        self.capacity = capacity
        self.tokens = capacity
        self.last_refill = time.time()
        self.lock = Lock()
    
    def consume(self, tokens: int = 1) -> bool:
        with self.lock:
            self._refill()
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False
    
    def _refill(self):
        now = time.time()
        elapsed = now - self.last_refill
        self.tokens = min(
            self.capacity,
            self.tokens + elapsed * self.rate
        )
        self.last_refill = now
```

### Sliding Window Log

More accurate, stores timestamps of each request.

```python
import time
from collections import deque

class SlidingWindowLog:
    def __init__(self, limit: int, window: int):
        self.limit = limit  # max requests
        self.window = window  # window in seconds
        self.requests = deque()
        self.lock = Lock()
    
    def is_allowed(self) -> bool:
        with self.lock:
            now = time.time()
            cutoff = now - self.window
            
            # Remove expired entries
            while self.requests and self.requests[0] < cutoff:
                self.requests.popleft()
            
            if len(self.requests) < self.limit:
                self.requests.append(now)
                return True
            return False
```

### Fixed Window

Simple but can have burst issues at window boundaries.

```python
import time

class FixedWindow:
    def __init__(self, limit: int, window: int):
        self.limit = limit
        self.window = window
        self.hits = 0
        self.window_start = int(time.time())
    
    def is_allowed(self) -> bool:
        now = int(time.time())
        if now >= self.window_start + self.window:
            self.hits = 0
            self.window_start = now
        
        if self.hits < self.limit:
            self.hits += 1
            return True
        return False
```

## Redis Implementation

```python
import redis
import time

class RedisRateLimiter:
    def __init__(self, redis_url: str, limit: int, window: int):
        self.redis = redis.from_url(redis_url)
        self.limit = limit
        self.window = window
    
    def is_allowed(self, key: str) -> tuple[bool, dict]:
        now = time.time()
        window_key = f"ratelimit:{key}:{int(now / self.window)}"
        
        pipe = self.redis.pipeline()
        pipe.incr(window_key)
        pipe.expire(window_key, self.window + 1)
        results = pipe.execute()
        
        current = results[0]
        remaining = max(0, self.limit - current)
        reset_at = (self.window_start + self.window) - now
        
        return current <= self.limit, {
            'limit': self.limit,
            'remaining': remaining,
            'reset': int(reset_at)
        }
```

## Flask Middleware

```python
from flask import Flask, request, jsonify
from functools import wraps

app = Flask(__name__)
limiter = RedisRateLimiter('redis://localhost:6379', 100, 60)

def rate_limit(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        key = f"ratelimit:{request.endpoint}:{request.remote_addr}"
        allowed, headers = limiter.is_allowed(key)
        
        if not allowed:
            return jsonify({'error': 'Rate limit exceeded'}), 429, headers
        
        return f(*args, **kwargs)
    return decorated

@app.route('/api/data')
@rate_limit
def get_data():
    return jsonify({'data': 'value'})
```

## FastAPI Middleware

```python
from fastapi import FastAPI, Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limiter: RedisRateLimiter):
        super().__init__(app)
        self.limiter = limiter
    
    async def dispatch(self, request: Request, call_next):
        key = f"ratelimit:{request.url.path}:{request.client.host}"
        allowed, headers = self.limiter.is_allowed(key)
        
        response = await call_next(request)
        
        for header, value in headers.items():
            response.headers[header] = str(value)
        
        if not allowed:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        
        return response
```

## Response Headers

Standard rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 3600
```

## Tiered Rate Limits

```python
TIERS = {
    'anonymous': {'limit': 10, 'window': 60},
    'basic': {'limit': 100, 'window': 60},
    'premium': {'limit': 1000, 'window': 60},
}

def get_rate_limit(user: User | None) -> tuple[int, int]:
    if not user:
        return TIERS['anonymous']['limit'], TIERS['anonymous']['window']
    return TIERS[user.tier]['limit'], TIERS[user.tier]['window']
```

## Best Practices

1. **Return standard headers** — let clients know their quota
2. **Use Redis for distributed limiting** — single-node can use in-memory
3. **Consider tiered limits** — reward authenticated users
4. **Add jitter** — prevent thundering herd at reset time
5. **Whitelist endpoints** — health checks should never be rate limited
6. **Be generous but firm** — limit exceeded should return clear error

## HTTP 429 Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 60 seconds.",
    "retry_after": 60
  }
}
```
