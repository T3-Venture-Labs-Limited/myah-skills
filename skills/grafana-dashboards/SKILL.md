---
name: grafana-dashboards
description: Design and deploy production Grafana dashboards for monitoring application metrics, infrastructure health, and business KPIs. Covers panel types, query builders, and alerting rules.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: analytics
  tags:
    - grafana
    - dashboards
    - monitoring
    - observability
    - metrics
    - prometheus
  personas:
    developer: 60
    researcher: 50
    analyst: 90
    operator: 85
    creator: 30
    support: 60
  summary: Build operational dashboards that surface what matters to your team
  featured: true
  requires:
    tools: [file-read, file-write, web-search, command-exec]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Grafana Dashboards

Create dashboards that give your team immediate visibility into system health,
user behavior, and business metrics. This skill covers the full lifecycle:
data sources, panel design, variable templating, and alerting.

## Core Principles

**A good dashboard answers a question in 5 seconds.**
If a teammate walking by a monitor can't understand the dashboard without
asking you, it's too complex. Start with the question, not the metrics.

**Layer information:**
- **Top row:** Key metrics (SLAs, error rates, active users)
- **Middle row:** Supporting context (trends, breakdowns)
- **Bottom row:** Detailed data for investigation (logs, traces)

## Data Sources

### Prometheus (Recommended)

Best for infrastructure and application metrics.

```promql
# CPU usage across all pods
sum(rate(container_cpu_usage_seconds_total{namespace="production"}[5m]))

# Request latency p99
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

### Loki (Logs)

```logql
{service="api"} |= "ERROR" | json | duration > 1s
```

### PostgreSQL

Use the Infinity plugin or built-in SQL datasource:

```sql
SELECT
  DATE_TRUNC('hour', created_at) AS time,
  COUNT(*) AS requests
FROM http_requests
WHERE $__timeFilter(created_at)
GROUP BY 1
ORDER BY 1
```

## Panel Types

| Panel Type | Use When | Example |
|---|---|---|
| **Time series** | Trends over time | Requests/sec, CPU usage |
| **Stat** | Single current value | Active users, error count |
| **Gauge** | Progress toward a target | Disk usage %, SLA compliance |
| **Table** | Dimensional data | Top 10 slow endpoints |
| **Pie chart** | Proportional breakdown | Traffic by region |
| **Heatmap** | Distribution over time | Request latency histogram |
| **Alert list** | Active alerts summary | Currently firing alerts |

## Dashboard Template Variables

Make dashboards interactive with variables:

```yaml
# Dashboard Settings → Variables → Add variable
Name: service
Type: Query
Query: label_values(http_requests_total, service)
```

Use in PromQL: `sum(rate(http_requests_total{service="$service"}[5m]))`

## Alerting

### Define Alert Rules

```yaml
groups:
  - name: api-alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m]))
          / sum(rate(http_requests_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Error rate exceeds 1%"
          runbook: "https://wiki.example.com/runbooks/high-error-rate"
```

### Notification Policies

Route alerts to the right team:

```
# Critical → PagerDuty → On-call engineer
# Warning → Slack #alerts
# Info → Slack #monitoring
```

## JSON Dashboard Format

Export dashboards as JSON for version control:

```bash
curl -s -H "Authorization: Bearer $GRAFANA_TOKEN" \
  "http://grafana:3000/api/dashboards/uid/my-dashboard" \
  | jq '.dashboard' > dashboards/my-dashboard.json
```

## Recommended Dashboard Layouts

### API Service Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ Requests/sec (time series)  │  Error Rate (time series) │
├─────────────────────────────┼───────────────────────────┤
│ Active Connections (stat)    │  p99 Latency (gauge)       │
├─────────────────────────────┴───────────────────────────┤
│ Top 10 Slow Endpoints (table)                            │
└─────────────────────────────────────────────────────────┘
```

### Infrastructure Overview

```
┌─────────────────────────────────────────────────────────┐
│ CPU Usage (heatmap by host)  │  Memory (heatmap by host) │
├──────────────────────────────┼──────────────────────────┤
│ Pod Restarts (alert list)    │  Disk I/O (time series)   │
└──────────────────────────────┴──────────────────────────┘
```

## Best Practices

1. **Use consistent color scales** — Green/Yellow/Red always means good/warning/critical
2. **Set appropriate time ranges** — 30m for operational, 30d for business metrics
3. **Add annotations** — Mark deployments, config changes, and incidents on the timeline
4. **Link to runbooks** — Every alert should point to a documented remediation
5. **Test alerts in staging** — Verify thresholds before going to production

## Provisioning

Provision dashboards via config for GitOps:

```yaml
# grafana.yaml
apiVersion: 1
providers:
  - name: 'Default'
    orgId: 1
    folder: 'Engineering'
    type: file
    options:
      path: /var/lib/grafana/dashboards
```

## Importing Dashboards

Grafana.com has thousands of community dashboards:

1. Find a dashboard at [grafana.com/dashboards](https://grafana.com/dashboards)
2. Copy the ID
3. Dashboard → Import → Paste ID → Select data source
