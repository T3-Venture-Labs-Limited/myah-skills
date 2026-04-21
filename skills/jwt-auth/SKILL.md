---
name: jwt-auth
description: Implement JSON Web Token authentication including token generation, verification, refresh tokens, and secure storage. Covers common security pitfalls and best practices.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - jwt
    - authentication
    - security
    - tokens
    - authorization
  personas:
    developer: 85
    researcher: 35
    analyst: 25
    operator: 45
    creator: 20
    support: 50
  summary: Implement secure JWT authentication with token generation, verification, and refresh
  featured: false
  requires:
    tools: [file-read, file-write, command-exec]
    mcp: []
    env: [JWT_SECRET]
  author:
    name: Myah Team
    url: https://myah.dev
---

# JWT Authentication

JSON Web Tokens (JWT) are a stateless authentication mechanism. This skill covers secure implementation patterns.

## JWT Structure

A JWT has three parts: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

## Python Implementation

### Token Generation

```python
import jwt
import datetime as dt

def create_access_token(user_id: str, expires_delta: dt.timedelta = None) -> str:
    secret = os.environ.get('JWT_SECRET')
    
    if expires_delta:
        expire = dt.datetime.utcnow() + expires_delta
    else:
        expire = dt.datetime.utcnow() + dt.timedelta(minutes=15)
    
    payload = {
        'sub': user_id,
        'exp': expire,
        'iat': dt.datetime.utcnow(),
        'type': 'access'
    }
    
    return jwt.encode(payload, secret, algorithm='HS256')
```

### Token Verification

```python
from jwt import PyJWTError

def verify_token(token: str) -> dict | None:
    secret = os.environ.get('JWT_SECRET')
    
    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload
    except PyJWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        return None
```

### Refresh Tokens

```python
import secrets

def create_refresh_token() -> str:
    """Long-lived token stored in database for session refresh."""
    return secrets.token_urlsafe(64)

def refresh_access_token(refresh_token: str) -> str | None:
    stored = db.get_refresh_token(refresh_token)
    if not stored or stored.get('expires_at') < dt.datetime.utcnow():
        return None
    
    return create_access_token(stored['user_id'])
```

## Security Best Practices

### 1. Use Strong Secrets

```python
import secrets
import os

# Generate on first startup
if not os.environ.get('JWT_SECRET'):
    os.environ['JWT_SECRET'] = secrets.token_urlsafe(64)
```

### 2. Short Access Token Lifetimes

```python
# Access tokens: 15 minutes
ACCESS_TOKEN_EXPIRE = dt.timedelta(minutes=15)

# Refresh tokens: 7 days (stored in DB)
REFRESH_TOKEN_EXPIRE = dt.timedelta(days=7)
```

### 3. Token Revocation

```python
# Store revoked tokens in Redis
REVOKED_TOKENS_KEY = 'revoked_tokens'

def revoke_token(token: str):
    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        exp = payload.get('exp')
        if exp:
            ttl = exp - dt.datetime.utcnow().timestamp()
            if ttl > 0:
                r.setex(f"{REVOKED_TOKENS_KEY}:{token}", int(ttl), '1')
    except PyJWTError:
        pass

def is_token_revoked(token: str) -> bool:
    return r.exists(f"{REVOKED_TOKENS_KEY}:{token}") > 0
```

### 4. Algorithm Validation

```python
# Always specify allowed algorithms
jwt.decode(token, secret, algorithms=['HS256'])

# Never use 'none' algorithm
# Never trust algorithm from token header
```

## Frontend Storage

```typescript
// Store in memory (most secure for short-lived tokens)
let accessToken: string | null = null;

// For refresh tokens, use httpOnly cookies
// Never store tokens in localStorage (XSS vulnerable)
```

## Middleware Example (FastAPI)

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(
    authorization: str = Depends(security)
) -> User:
    token = authorization.credentials
    
    if is_token_revoked(token):
        raise HTTPException(status_code=401, detail="Token revoked")
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = get_user(payload['sub'])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user
```
