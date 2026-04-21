---
name: oauth2-flow
description: Implement OAuth 2.0 authorization flows including authorization code, PKCE, and client credentials. Integrate with providers like Google, GitHub, and custom identity providers.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - oauth2
    - authentication
    - authorization
    - security
    - identity
  personas:
    developer: 80
    researcher: 40
    analyst: 25
    operator: 40
    creator: 15
    support: 45
  summary: Implement OAuth 2.0 flows for secure third-party authentication and authorization
  featured: false
  requires:
    tools: [file-read, file-write, command-exec]
    mcp: []
    env: [OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_URI]
  author:
    name: Myah Team
    url: https://myah.dev
---

# OAuth 2.0 Implementation

OAuth 2.0 lets users grant third-party applications access to their resources without sharing passwords.

## Flow Comparison

| Flow | Use Case |
|------|----------|
| Authorization Code | Web apps with backend |
| Authorization Code + PKCE | SPAs and mobile apps |
| Client Credentials | Machine-to-machine |
| Device Code | CLI tools and smart TVs |

## Authorization Code Flow (Web Apps)

### Step 1: Redirect to Authorization Server

```python
import secrets
import base64

def get_authorization_url(state: str = None) -> str:
    if not state:
        state = secrets.token_urlsafe(32)
    
    # Store state in session for verification
    session['oauth_state'] = state
    
    params = {
        'response_type': 'code',
        'client_id': os.environ['OAUTH_CLIENT_ID'],
        'redirect_uri': os.environ['OAUTH_REDIRECT_URI'],
        'scope': 'openid profile email',
        'state': state
    }
    
    return f"https://auth.example.com/authorize?{urlencode(params)}"
```

### Step 2: Exchange Code for Tokens

```python
import requests

def exchange_code_for_tokens(code: str, state: str) -> dict:
    # Verify state
    if state != session.get('oauth_state'):
        raise ValueError("Invalid state parameter")
    
    response = requests.post('https://auth.example.com/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': os.environ['OAUTH_REDIRECT_URI'],
        'client_id': os.environ['OAUTH_CLIENT_ID'],
        'client_secret': os.environ['OAUTH_CLIENT_SECRET']
    })
    
    return response.json()
```

## PKCE Flow (SPAs and Mobile)

PKCE adds cryptographic proof to prevent authorization code interception.

### Generate Code Verifier and Challenge

```python
import secrets
import hashlib
import base64

def generate_pkce_pair():
    verifier = secrets.token_urlsafe(64)
    
    # SHA256 hash
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b'=').decode()
    
    return verifier, challenge
```

### Token Exchange with PKCE

```python
def exchange_code_with_pkce(code: str, verifier: str) -> dict:
    response = requests.post('https://auth.example.com/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': os.environ['OAUTH_REDIRECT_URI'],
        'client_id': os.environ['OAUTH_CLIENT_ID'],
        'code_verifier': verifier
    })
    
    return response.json()
```

## Client Credentials (M2M)

```python
def get_machine_token() -> str:
    response = requests.post('https://auth.example.com/token', data={
        'grant_type': 'client_credentials',
        'client_id': os.environ['OAUTH_CLIENT_ID'],
        'client_secret': os.environ['OAUTH_CLIENT_SECRET'],
        'scope': 'api:read api:write'
    })
    
    return response.json()['access_token']
```

## Token Refresh

```python
def refresh_access_token(refresh_token: str) -> dict:
    response = requests.post('https://auth.example.com/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': os.environ['OAUTH_CLIENT_ID'],
        'client_secret': os.environ['OAUTH_CLIENT_SECRET']
    })
    
    return response.json()
```

## Provider Examples

### GitHub

```python
GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_API_URL = "https://api.github.com"

def get_github_user(token: str) -> dict:
    response = requests.get(
        f"{GITHUB_API_URL}/user",
        headers={'Authorization': f'Bearer {token}'}
    )
    return response.json()
```

### Google

```python
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_API_URL = "https://www.googleapis.com/oauth2/v2"

SCOPES = ['openid', 'profile', 'email']
```

## Security Considerations

1. **Validate state parameter** — prevents CSRF attacks
2. **Use PKCE for public clients** — SPAs, mobile apps
3. **Store secrets server-side only** — never expose client_secret
4. **Use HTTPS** — all OAuth traffic must be encrypted
5. **Short token lifetimes** — combine with refresh tokens
6. **Implement token revocation** — for logout and security events
