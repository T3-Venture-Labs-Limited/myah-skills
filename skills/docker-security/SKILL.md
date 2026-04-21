---
name: docker-security
description: Secure Docker containers through hardening, minimal base images, user namespaces, secrets management, and vulnerability scanning. Protect your container runtime and images.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - docker
    - security
    - containers
    - hardening
    - vulnerabilities
  personas:
    developer: 60
    researcher: 35
    analyst: 30
    operator: 85
    creator: 15
    support: 40
  summary: Harden Docker containers with security best practices and vulnerability scanning
  featured: false
  requires:
    tools: [command-exec, file-read]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Docker Security

Container security requires attention at every layer: images, runtime, network, and secrets.

## Minimal Base Images

```dockerfile
# Good: Specific version, minimal distro
FROM python:3.12-slim@sha256:abc123...

# Better: Distroless
FROM gcr.io/distroless/python3-debian12

# Best: Scratch (no OS)
FROM scratch
COPY --from=builder /app /app
CMD ["/app"]
```

## Non-Root User

```dockerfile
# Create user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Switch to non-root
USER appuser

# Or use numeric UID for distroless
USER 65532
```

## Read-Only Root Filesystem

```yaml
# docker-compose.yml
services:
  app:
    read_only: true
    tmpfs:
      - /tmp
      - /run
```

## Capability Dropping

```yaml
services:
  app:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # Only if needed
```

## Secrets Management

```dockerfile
# NEVER do this
ENV DATABASE_PASSWORD=secret123

# Do this: use Docker secrets at runtime
RUN mount | grep secrets  # In container
```

```yaml
# docker-compose.yml
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  app:
    secrets:
      - db_password
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password
```

## Vulnerability Scanning

### Trivy

```bash
# Scan image
trivy image myapp:latest

# Scan in CI
trivy fs --security-checks vuln,config .

# GitHub Action
- name: Run Trivy
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: myapp:${{ github.sha }}
    format: sarif
    output: trivy-results.sarif
```

### Hadolint

```dockerfile
# hadolint ignore=DL3008
FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*
```

## Security Best Practices

### Docker Bench

```bash
docker run -it --net host --pid host --userns host \
  --cap-add audit_control \
  -e DOCKER_CONTENT_TRUST=1 \
  aquasec/docker-bench-security:latest
```

### Image Signing

```bash
# Enable content trust
export DOCKER_CONTENT_TRUST=1
export DOCKER_CONTENT_TRUST_SERVER=https://notary.example.com

# Sign image
docker trust sign myapp:latest

# Verify
docker trust inspect myapp:latest
```

## Network Isolation

```yaml
services:
  app:
    networks:
      - frontend
      - backend
  
  db:
    networks:
      - backend
    # No external access

networks:
  frontend:
    internal: false
  backend:
    internal: true  # No external access
```

## Resource Limits

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Automated Updates

```yaml
# Watchtower - auto-update running containers
services:
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_INCLUDE_STOPPED=true
```

## Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
```
