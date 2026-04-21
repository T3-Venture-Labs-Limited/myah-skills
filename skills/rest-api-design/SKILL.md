---
name: rest-api-design
description: Design RESTful APIs following best practices for URL structure, HTTP methods, status codes, versioning, and documentation. Create consistent, intuitive APIs.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - rest
    - api
    - http
    - restful
    - web-services
  personas:
    developer: 90
    researcher: 35
    analyst: 30
    operator: 35
    creator: 30
    support: 40
  summary: Design clean RESTful APIs with proper versioning, error handling, and documentation
  featured: false
  requires:
    tools: [file-read, file-write]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# REST API Design

REST is an architectural style. This skill covers designing APIs that are intuitive, consistent, and maintainable.

## URL Structure

### Resource Naming

```
/users              # Collection of users
/users/123          # Specific user
/users/123/posts    # User's posts
/posts/123/author   # Post's author
```

### Guidelines

- Use **nouns**, not verbs: `/users` not `/getUsers`
- Use **plural** nouns: `/users` not `/user`
- Use **kebab-case**: `/user-profiles` not `/userProfiles`
- **Nest** related resources max 2 levels deep

### Bad vs Good

```
BAD:  GET /getUser?id=123
GOOD: GET /users/123

BAD:  POST /api/createUser
GOOD: POST /users

BAD:  GET /users/123/posts/456/author/name
GOOD: GET /posts/456?include=author
```

## HTTP Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Read resource | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Replace resource | Yes | No |
| PATCH | Update fields | No | No |
| DELETE | Remove resource | Yes | No |

## Status Codes

### Success

| Code | Meaning |
|------|---------|
| 200 | OK (standard success) |
| 201 | Created (resource created) |
| 202 | Accepted (async processing) |
| 204 | No Content (success, no body) |

### Client Errors

| Code | Meaning |
|------|---------|
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (authenticated but not authorized) |
| 404 | Not Found |
| 409 | Conflict (duplicate, version mismatch) |
| 422 | Unprocessable Entity (validation errors) |
| 429 | Too Many Requests (rate limited) |

### Server Errors

| Code | Meaning |
|------|---------|
| 500 | Internal Server Error |
| 502 | Bad Gateway |
| 503 | Service Unavailable |
| 504 | Gateway Timeout |

## Request/Response Format

### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

### Response Envelope

```json
{
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {"field": "email", "message": "Must be a valid email"},
      {"field": "age", "message": "Must be positive"}
    ]
  },
  "meta": {
    "requestId": "req_abc123"
  }
}
```

## API Versioning

### URL Path (Most Common)

```
/api/v1/users
/api/v2/users
```

### Header

```
Accept: application/vnd.myapi.v2+json
```

### Query Parameter

```
/users?version=2
```

## Pagination

```json
{
  "data": [...],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total": 150,
    "hasMore": true,
    "nextCursor": "eyJpZCI6MTAwfQ=="
  }
}
```

## Filtering and Sorting

### Filtering

```
GET /users?status=active&role=admin
GET /posts?author_id=123&published=true
```

### Sorting

```
GET /users?sort=created_at
GET /users?sort=-created_at  (descending)
GET /users?sort=name,-created_at
```

## Rate Limiting Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
Retry-After: 3600
```

## OpenAPI Example

```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
```
