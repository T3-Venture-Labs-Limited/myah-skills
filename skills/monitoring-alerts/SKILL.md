---
name: monitoring-alerts
description: Set up comprehensive monitoring and alerting with Prometheus, Grafana, and structured logging. Define SLOs, create dashboards, and configure alert routing to PagerDuty or Slack.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - monitoring
    - prometheus
    - grafana
    - alerts
    - observability
  personas:
    developer: 55
    researcher: 30
    analyst: 60
    operator: 90
    creator: 15
    support: 50
  summary: Set up monitoring dashboards and alerts with Prometheus, Grafana, and structured logging
  featured: false
  requires:
    tools: [command-exec, file-read]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Monitoring and Alerting

You can't fix what you can't see. This skill covers comprehensive observability.

## Prometheus Metrics

### Python Instrumentation

```python
from prometheus_client import Counter, Histogram, Gauge

# Counters - only increase
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

# Histograms - track distributions
request_duration = Histogram(
    'request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

# Gauges - can go up or down
active_connections = Gauge(
    'active_connections',
    'Number of active connections'
)

# Usage
http_requests_total.labels(method='GET', endpoint='/api/users', status='200').inc()
request_duration.labels(method='GET', endpoint='/api/users').observe(0.042)
```

### Express Middleware

```javascript
const promClient = require('prom-client');

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path, status: res.statusCode });
  });
  next();
});
```

## Grafana Dashboards

### JSON Dashboard

```json
{
  "dashboard": {
    "title": "API Performance",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m]))"
          }
        ]
      }
    ]
  }
}
```

## Alert Rules

```yaml
groups:
  - name: api-alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate {{ $value | humanizePercentage }}"
          runbook: "https://wiki.runbook.com/high-error-rate"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            sum(rate(request_duration_bucket[5m])) by (le)
          ) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "p95 latency above 1s"
```

## Structured Logging

### Python Logging

```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'message': record.getMessage(),
            'logger': record.name,
        }
        
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)

handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger = logging.getLogger(__name__)
logger.addHandler(handler)
```

## Health Checks

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 15

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Health Endpoint

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health/live")
def liveness():
    return {"status": "ok"}

@app.get("/health/ready")
def readiness():
    # Check dependencies
    if not db.is_connected():
        return {"status": "error", "reason": "db_unavailable"}
    return {"status": "ok"}
```

## SLO Definition

```yaml
slos:
  - name: api-availability
    target: 99.9
    window: 30d
    indicator:
      type: request-success
      good:
        metric: http_requests_total{status!~"5.."}
      total:
        metric: http_requests_total

  - name: api-latency
    target: 99.0
    window: 30d
    indicator:
      type: latency
      query: |
        histogram_quantile(0.99,
          sum(rate(request_duration_bucket[5m])) by (le)
        )
      threshold: 1s
```

## Alert Routing

```yaml
route:
  group_by: ['alertname', 'cluster']
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
    - match:
        severity: warning
      receiver: 'slack-notifications'

receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '{{ .Values.pagerduty.key }}'
        severity: critical

  - name: 'slack-notifications'
    slack_configs:
      - channel: '#alerts'
        send_resolved: true
```
