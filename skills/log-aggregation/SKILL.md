---
name: log-aggregation
description: Aggregate and analyze logs across services using structured logging, ELK stack, and Loki. Implement log levels, correlation IDs, and alerting on error patterns.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - logging
    - observability
    - elk
    - loki
    - monitoring
    - structured-logs
  personas:
    developer: 60
    researcher: 40
    analyst: 70
    operator: 90
    creator: 15
    support: 55
  summary: Aggregate and analyze logs across services with structured logging and ELK/Loki
  featured: false
  requires:
    tools: [command-exec, file-read]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Log Aggregation

Centralized logging is essential for debugging distributed systems. This skill covers structured logging and aggregation.

## Structured Logging

### Python with structlog

```python
import structlog

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

log = structlog.get_logger()

log.info("user_action", user_id="123", action="purchase", amount=99.99)
```

### Output Format

```json
{
  "event": "user_action",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "user_id": "123",
  "action": "purchase",
  "amount": 99.99,
  "level": "info"
}
```

## ELK Stack (Elasticsearch, Logstash, Kibana)

### Docker Compose

```yaml
version: '3'
services:
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  logstash:
    image: logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"

  kibana:
    image: kibana:8.11.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
```

### Logstash Pipeline

```conf
input {
  beats {
    port => 5044
  }
}

filter {
  json {
    source => "message"
  }
  
  date {
    match => ["timestamp", "ISO8601"]
    target => "@timestamp"
  }
  
  if [level] == "ERROR" {
    mutate {
      add_tag => ["error"]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
}
```

## Loki (Grafana Stack)

### Promtail Config

```yaml
server:
  http_listen_port: 9080

positions:
  filename: /var/log/positions.yaml

client:
  url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: app-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: myapp
          __path__: /var/log/myapp/*.log
```

### Loki Query (LogQL)

```logql
# All logs from myapp
{service="myapp"}

# Error logs only
{service="myapp"} |= "ERROR"

# Logs containing specific user
{service="myapp"} | json | user_id="123"

# Rate of errors per minute
rate({service="myapp"} |= "ERROR"[5m])
```

## Correlation IDs

```python
import uuid
from contextvars import ContextVar
from functools import wraps

correlation_id: ContextVar[str] = ContextVar('correlation_id', default='')

def with_correlation_id(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        cid = correlation_id.get() or str(uuid.uuid4())
        correlation_id.set(cid)
        
        log = structlog.get_logger()
        log = log.bind(correlation_id=cid)
        
        return func(*args, **kwargs)
    return wrapper

@app.middleware
async def add_correlation_id(request, call_next):
    request_id = request.headers.get('X-Correlation-ID', str(uuid.uuid4()))
    correlation_id.set(request_id)
    
    response = await call_next(request)
    response.headers['X-Correlation-ID'] = request_id
    
    return response
```

## Log Levels

| Level | Use Case |
|-------|----------|
| DEBUG | Detailed debugging info (dev only) |
| INFO | Normal operation events |
| WARNING | Unexpected but handled situations |
| ERROR | Errors that need attention |
| CRITICAL | System-level failures |

```python
log.debug("Entering function", function="process_order")
log.info("Order created", order_id="12345", amount=99.99)
log.warning("Retrying after failure", attempt=2, max_attempts=3)
log.error("Payment failed", order_id="12345", reason="insufficient_funds")
log.critical("Database unreachable", host="db.example.com")
```

## Python Logging Configuration

```python
import logging
import logging.config

LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
        }
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'json',
        }
    },
    'loggers': {
        'myapp': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
        }
    }
}

logging.config.dictConfig(LOGGING_CONFIG)
```

## Alerting on Error Patterns

### Prometheus Alert Rules

```yaml
groups:
  - name: log-alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate({service="myapp"} |= "ERROR"[5m]))
          /
          sum(rate({service="myapp"}[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate in myapp"
```

## Log Retention

```bash
# Elasticsearch index lifecycle
curl -X PUT "localhost:9200/_ilm/policy/app-logs-policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_age": "7d",
            "max_size": "50gb"
          }
        }
      },
      "warm": {
        "min_age": "30d",
        "actions": {
          "shrink": { "number_of_shards": 1 }
        }
      },
      "delete": {
        "min_age": "365d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
'
```

## Best Practices

1. **Use structured logging** — JSON format for easy parsing
2. **Include correlation IDs** — trace requests across services
3. **Log at appropriate levels** — don't log everything at INFO
4. **Sanitize sensitive data** — never log passwords, tokens, PII
5. **Set log rotation** — prevent disk exhaustion
6. **Create indexes/labels** — make logs searchable
7. **Alert on patterns** — errors, latency spikes, unusual activity
