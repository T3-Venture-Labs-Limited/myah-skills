---
name: ssl-tls-certificates
description: Manage SSL/TLS certificates for secure HTTPS connections. Implement certificate rotation, Let's Encrypt automation, and HSTS policies for production security.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - ssl
    - tls
    - certificates
    - https
    - security
    - lets-encrypt
  personas:
    developer: 55
    researcher: 30
    analyst: 20
    operator: 90
    creator: 15
    support: 50
  summary: Manage SSL/TLS certificates for HTTPS, Let's Encrypt automation, and certificate rotation
  featured: false
  requires:
    tools: [command-exec, file-read]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# SSL/TLS Certificate Management

Secure communications require valid certificates. This skill covers certificate management for production.

## Certificate Types

| Type | Validation | Use Case |
|------|------------|----------|
| DV (Domain Validation) | Email/DNS check | Standard websites |
| OV (Organization Validation) | Business verification | Business sites |
| EV (Extended Validation) | Strict business checks | Banks, enterprises |
| Wildcard | `*.example.com` | Multiple subdomains |
| SAN | Multiple domains in one cert | Unified certificates |

## Let's Encrypt with Certbot

### Installation

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# Standalone (without nginx plugin)
sudo apt install certbot
```

### Obtaining Certificate

```bash
# Interactive (creates nginx config automatically)
sudo certbot --nginx -d example.com -d www.example.com

# Standalone (stop nginx first)
sudo certbot certonly --standalone -d example.com

# Webroot (for existing nginx)
sudo certbot certonly --webroot -w /var/www/html -d example.com
```

### Certificate Locations

```bash
# Live certificates
/etc/letsencrypt/live/example.com/

# Files
fullchain.pem   # Certificate + intermediates
privkey.pem      # Private key
cert.pem         # Certificate only
chain.pem        # Intermediate certificates
```

## Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Modern TLS configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=86400s;
    resolver_timeout 5s;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

## HSTS Header

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

## Auto-Renewal

### Cron Job

```bash
# Edit crontab
sudo crontab -e

# Add renewal check twice daily
0 0,12 * * * certbot renew --quiet
```

### Systemd Timer (Preferred)

```bash
# Create timer
sudo tee /etc/systemd/system/certbot-renew.timer << 'EOF'
[Unit]
Description=Certbot renewal timer

[Timer]
OnCalendar=*-*-* 00,12:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Enable timer
sudo systemctl enable certbot-renew.timer
sudo systemctl start certbot-renew.timer
```

## Certificate Renewal Script

```bash
#!/bin/bash
certbot renew --pre-hook "nginx -s reload" --post-hook "nginx -s reload"
```

## Docker with Let's Encrypt

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro

  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h; done;'"
```

## Certificate Monitoring

```python
import ssl
import socket
from datetime import datetime

def check_certificate_expiry(hostname: str, port: int = 443) -> dict:
    context = ssl.create_default_context()
    with socket.create_connection((hostname, port)) as sock:
        with context.wrap_socket(sock, server_hostname=hostname) as ssock:
            cert = ssock.getpeercert()
            expiry = datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
            days_until_expiry = (expiry - datetime.utcnow()).days
            
            return {
                'hostname': hostname,
                'expires': expiry.isoformat(),
                'days_remaining': days_until_expiry,
                'expired': days_until_expiry < 0
            }
```

## Certificate Chains

```bash
# View certificate chain
openssl s_client -connect example.com:443 -showcerts

# Verify certificate
openssl verify -CAfile fullchain.pem cert.pem

# Check certificate info
openssl x509 -in cert.pem -text -noout
```

## ACME Protocol (Let's Encrypt API)

```python
import acme.client
import josepy as jose

# ACME v2 endpoints
ACME_DIRECTORY = 'https://acme-v02.api.letsencrypt.org/directory'

# For automated renewal, use certbot library
# or acme library directly
```
