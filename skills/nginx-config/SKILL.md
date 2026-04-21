---
name: nginx-config
description: Configure Nginx for reverse proxy, load balancing, SSL termination, and static file serving. Includes rate limiting, caching, and security header configuration.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - nginx
    - reverse-proxy
    - load-balancing
    - ssl
    - web-server
  personas:
    developer: 65
    researcher: 25
    analyst: 20
    operator: 90
    creator: 15
    support: 40
  summary: Configure Nginx as reverse proxy, load balancer, and SSL termination endpoint
  featured: false
  requires:
    tools: [command-exec, file-read, file-write]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Nginx Configuration

Nginx is a high-performance web server that excels at reverse proxying, load balancing, and SSL termination.

## Basic Reverse Proxy

```nginx
server {
    listen 80;
    server_name example.com;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:4000;
    }
}
```

## SSL Termination

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/ssl/certs/example.com.crt;
    ssl_certificate_key /etc/ssl/private/example.com.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

## Load Balancing

```nginx
upstream backend {
    least_conn;  # or: ip_hash; or: hash $request_uri consistent;
    
    server 10.0.1.1:3000 weight=3;
    server 10.0.1.2:3000 weight=2;
    server 10.0.1.3:3000;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://backend;
    }
}
```

## Rate Limiting

```nginx
http {
    # Define rate limit zone
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    
    server {
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://localhost:3000;
        }
    }
}
```

## Caching

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m 
                 max_size=1g inactive=60m use_temp_path=off;

server {
    location /api/ {
        proxy_cache api_cache;
        proxy_cache_valid 200 60s;
        proxy_cache_use_stale error timeout updating;
        add_header X-Cache-Status $upstream_cache_status;
        proxy_pass http://localhost:3000;
    }
}
```

## Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

## Static File Serving

```nginx
server {
    listen 80;
    server_name static.example.com;
    root /var/www/static;
    
    location / {
        expires 7d;
        add_header Cache-Control "public, immutable";
        
        # Enable gzip compression
        gzip on;
        gzip_types text/css application/javascript image/svg+xml;
    }
}
```

## Testing Configuration

```bash
# Test syntax
nginx -t

# Reload (no downtime)
nginx -s reload

# Full restart
systemctl restart nginx
```
