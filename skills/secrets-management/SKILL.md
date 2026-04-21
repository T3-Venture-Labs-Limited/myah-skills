---
name: secrets-management
description: Manage application secrets securely using environment variables, secret stores, and encryption. Implement secret rotation and access auditing.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - secrets
    - security
    - environment-variables
    - vault
    - encryption
  personas:
    developer: 65
    researcher: 30
    analyst: 25
    operator: 90
    creator: 15
    support: 45
  summary: Secure secrets management with environment variables, Vault, and secret rotation
  featured: false
  requires:
    tools: [file-read, file-write, command-exec]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Secrets Management

Never hardcode secrets. This skill covers secure handling of API keys, passwords, and tokens.

## Environment Variables

### Development

```bash
# .env file (NEVER commit this)
DATABASE_URL=postgres://user:secret@localhost/db
JWT_SECRET=your-super-secret-key-here
STRIPE_API_KEY=sk_test_xxx

# Load in application
from dotenv import load_dotenv
load_dotenv()
```

### Production

```bash
# Systemd service
Environment="DATABASE_URL=postgres://..."
Environment="JWT_SECRET=xxx"

# Or use secrets service
ExecStart=/usr/bin/myapp
EnvironmentFile=/run/secrets/myapp.env
```

## Docker Secrets

```yaml
# docker-compose.yml
services:
  app:
    secrets:
      - db_password
      - api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    file: ./secrets/api_key.txt
```

## HashiCorp Vault

### Setup

```bash
vault server -dev
export VAULT_ADDR='http://127.0.0.1:8200'
vault login root
```

### Store Secrets

```bash
# Key-value secrets
vault kv put secret/myapp/database url="postgres://..."

# Enable transit encryption
vault secrets enable transit

# Encrypt data
vault write transit/encrypt/myapp plaintext=$(base64 <<< "sensitive-data")
```

### Application Integration

```python
import hvac

client = hvac.Client(url=os.environ['VAULT_ADDR'])
client.token = os.environ['VAULT_TOKEN']

# Read secret
secret = client.secrets.kv.v2.read_secret_version(
    path='myapp/database',
    mount_point='secret'
)
db_url = secret['data']['data']['url']
```

### Kubernetes Integration

```yaml
# External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: myapp-secrets
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault
    kind: ClusterSecretStore
  target:
    name: myapp-secrets
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: myapp/database
        property: url
```

## AWS Secrets Manager

```python
import boto3

secrets_manager = boto3.client('secretsmanager')

# Get secret
response = secrets_manager.get_secret_value(
    SecretId='myapp/database'
)
db_password = response['SecretString']
```

## Secret Rotation

### PostgreSQL

```python
import boto3
import psycopg2
from datetime import datetime

def rotate_database_password():
    # Get current credentials
    sm = boto3.client('secretsmanager')
    current = sm.get_secret_value(SecretId='myapp/db')
    credentials = json.loads(current['SecretString'])
    
    # Generate new password
    new_password = secrets.token_urlsafe(32)
    
    # Update database
    conn = psycopg2.connect(dsn=current['engine_url'])
    with conn.cursor() as cur:
        cur.execute(f"ALTER USER {credentials['username']} WITH PASSWORD %s", (new_password,))
    
    # Store new secret
    sm.put_secret_value(
        SecretId='myapp/db',
        SecretString=json.dumps({**credentials, 'password': new_password}),
        VersionStages=['AWSCURRENT']
    )
```

## Encryption at Rest

```python
from cryptography.fernet import Fernet

# Generate key (store securely!)
key = Fernet.generate_key()
cipher = Fernet(key)

# Encrypt
encrypted = cipher.encrypt(b'sensitive data')

# Decrypt
decrypted = cipher.decrypt(encrypted)
```

## Best Practices

1. **Never log secrets** — mask in logs
2. **Short-lived credentials** — rotate frequently
3. **Principle of least privilege** — each service gets only what it needs
4. **Audit access** — log who accessed what
5. **Separate environments** — dev/prod secrets in different stores
6. **Secrets in memory only** — don't persist to disk
7. **Automatic rotation** — don't rely on manual rotation

## Logging (Safe Patterns)

```python
import logging

class SecretFilter(logging.Filter):
    SECRETS = {'password', 'token', 'key', 'secret', 'authorization'}
    
    def filter(self, record):
        for secret in self.SECRETS:
            if secret in record.msg.lower():
                record.msg = record.msg.replace(secret, '***REDACTED***')
        return True

logger.addFilter(SecretFilter())
```
