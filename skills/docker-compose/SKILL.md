---
name: docker-compose
description: Define and run multi-container Docker applications with Docker Compose. Covers service definitions, networking, volumes, secrets management, and local development workflows.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - docker
    - containers
    - compose
    - devops
    - local-development
    - microservices
  personas:
    developer: 80
    researcher: 30
    analyst: 25
    operator: 90
    creator: 20
    support: 50
  summary: Orchestrate multi-container applications with Docker Compose
  featured: false
  requires:
    tools: [file-read, file-write, command-exec, web-search]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Docker Compose

Define your entire application stack in a single `docker-compose.yml` file.
Docker Compose makes it easy to run multi-container applications locally,
in CI, or on a single server.

## Core Concepts

- **Services** — Each container is a "service" (web, database, redis)
- **Networks** — Services communicate on a shared network by default
- **Volumes** — Persist data across restarts
- **Profiles** — Group services for specific use cases (dev, test)

## Basic docker-compose.yml

```yaml
version: "3.9"

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: myapp
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:

networks:
  default:
    name: myapp-network
```

## Common Patterns

### Environment Files

```bash
# .env file (never commit this!)
DATABASE_URL=postgres://user:pass@localhost:5432/myapp
API_SECRET=your-secret-key-here
```

```yaml
env_file:
  - path: .env
    required: true
```

### Multi-stage Builds for Small Images

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Secrets (Production)

```yaml
services:
  web:
    secrets:
      - db_password
      - api_key
    environment:
      - DATABASE_PASSWORD_FILE=/run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### Profiles (Selective Service Startup)

```yaml
services:
  web:
    build: .
    profiles:
      - default

  test:
    build: .
    profiles:
      - test
    command: npm test

  debug:
    image: postgres:16-alpine
    profiles:
      - debug
    ports:
      - "5432:5432"
```

Start with profiles: `docker compose --profile debug up`

## Local Development Workflow

### Development Override

```yaml
# docker-compose.override.yml (auto-loaded in dev)
services:
  web:
    build:
      context: .
      target: development
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DEBUG=true
    command: npm run dev:debug
    ports:
      - "3000:3000"
      - "9229:9229"  # Node debugger
```

### Start the Stack

```bash
# First time
docker compose up --build

# Start in background
docker compose up -d --build

# Watch logs
docker compose logs -f web

# Restart a service
docker compose restart web

# Rebuild without cache
docker compose build --no-cache
```

### Clean Up

```bash
# Stop and remove containers, networks
docker compose down

# Also remove volumes (CAREFUL - deletes data!)
docker compose down -v

# Remove images
docker compose down --rmi local
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs service-name

# Inspect container
docker compose exec service-name sh

# Recreate without cache
docker compose up -d --force-recreate --build service-name
```

### Port Conflicts

```bash
# Find what's using port 3000
lsof -i :3000

# Override port in compose
ports:
  - "3001:3000"  # host:container
```

### Database Connection Issues

```bash
# Check if db is healthy
docker compose ps

# Run commands in db container
docker compose exec db psql -U user -d myapp

# Check network connectivity
docker compose exec web ping db
```

### Slow Performance in Dev

```yaml
# Use host networking for macOS
services:
  web:
    network_mode: host
```

## Docker Compose in Production

Docker Compose is single-host orchestration. For production:

```bash
# Run on a specific host
scp docker-compose.yml host:/opt/app/
ssh host "docker compose -f /opt/app/docker-compose.yml up -d"

# Or use Docker Swarm mode
docker stack deploy -c docker-compose.yml myapp
```

For multi-host orchestration, graduate to Kubernetes.
