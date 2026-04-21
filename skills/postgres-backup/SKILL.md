---
name: postgres-backup
description: Implement reliable backup and restore strategies for PostgreSQL databases. Covers automated backups to S3, point-in-time recovery, and disaster recovery runbooks.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - postgresql
    - backup
    - disaster-recovery
    - database
    - s3
    - devops
  personas:
    developer: 60
    researcher: 30
    analyst: 40
    operator: 95
    creator: 15
    support: 70
  summary: Implement automated PostgreSQL backups with point-in-time recovery capability
  featured: false
  requires:
    tools: [file-read, file-write, command-exec]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# PostgreSQL Backup

Protect your data with a solid backup strategy. This skill covers
automated backups to S3, point-in-time recovery (PITR), and testing
your restore procedure.

## Core Concepts

- **pg_dump** — Logical backup, creates a SQL file or custom format archive
- **Continuous WAL archiving** — Enables point-in-time recovery
- **Base backup** — Physical copy of the data directory
- **Retention** — How long to keep backups before cleanup

## Backup Strategy

### Daily Logical Backups with pg_dump

```bash
#!/bin/bash
# scripts/backup.sh

set -euo pipefail

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-mydb}"
DB_USER="${DB_USER:-postgres}"
S3_BUCKET="${S3_BUCKET:-my-backups}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Create logical backup in custom format (compressed)
pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -Fc \
  -f "${BACKUP_DIR}/${DB_NAME}_${DATE}.dump"

# Encrypt and upload to S3
aws s3 cp \
  "${BACKUP_DIR}/${DB_NAME}_${DATE}.dump" \
  "s3://${S3_BUCKET}/postgres/${DB_NAME}/"

# Clean up local file
rm "${BACKUP_DIR}/${DB_NAME}_${DATE}.dump"

# Clean up old S3 backups (keep last 30 days)
aws s3 ls "s3://${S3_BUCKET}/postgres/${DB_NAME}/" | \
  while read -r line; do
    backup_date=$(echo "$line" | awk '{print $4}')
    if [[ $(date -d "${backup_date%%.dump}" +%s) -lt $(date -d "30 days ago" +%s) ]]; then
      aws s3 rm "s3://${S3_BUCKET}/postgres/${DB_NAME}/${backup_date}"
    fi
  done

echo "Backup completed: ${DATE}"
```

### Cron Schedule

```bash
# Add to crontab
0 2 * * * /opt/scripts/backup.sh >> /var/log/postgres-backup.log 2>&1
```

## Continuous WAL Archiving (Point-in-Time Recovery)

### Configure wal_level

```bash
# postgresql.conf
wal_level = replica
max_wal_senders = 3
max_replication_slots = 3
wal_keep_size = 1GB

# Archive command (upload WAL segments to S3)
archive_mode = on
archive_command = 'aws s3 cp %p s3://my-backups/wal/%f'
archive_timeout = 300  # Force archive every 5 minutes
```

### Create a Replication Slot

```sql
SELECT * FROM pg_create_physical_replication_slot('backup_slot');
```

### Base Backup

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="my-backups"

# Create base backup using pg_basebackup
pg_basebackup \
  -h localhost \
  -U postgres \
  -D /tmp/basebackup_${DATE} \
  -Ft \
  -z \
  -P \
  -Xs

# Upload to S3
aws s3 cp /tmp/basebackup_${DATE} "s3://${S3_BUCKET}/basebackups/" --recursive

# Cleanup
rm -rf /tmp/basebackup_${DATE}
```

## Restore Procedures

### Restore from Logical Backup

```bash
# Drop existing connections
psql -h localhost -U postgres -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = 'mydb' AND pid <> pg_backend_pid();
"

# Drop and recreate database
dropdb -h localhost -U postgres mydb
createdb -h localhost -U postgres mydb

# Restore
pg_restore \
  -h localhost \
  -U postgres \
  -d mydb \
  -c \
  "mydb_backup.dump"
```

### Point-in-Time Recovery

```bash
# 1. Stop PostgreSQL
sudo systemctl stop postgresql

# 2. Backup current data directory
sudo cp -rf /var/lib/postgresql/data /var/lib/postgresql/data.bak

# 3. Clear data directory
sudo rm -rf /var/lib/postgresql/data/*

# 4. Download base backup
aws s3 cp "s3://my-backups/basebackups/" /tmp/basebackup --recursive

# 5. Extract base backup
pg_basebackup -h localhost -U postgres -D /var/lib/postgresql/data -Ft -z -P

# 6. Create recovery signal
touch /var/lib/postgresql/data/recovery.signal

# 7. Configure recovery
restore_command = 'aws s3 cp s3://my-backups/wal/%f %p'
recovery_target_time = '2024-03-15 14:30:00 UTC'
recovery_target_action = 'promote'

# 8. Start PostgreSQL
sudo systemctl start postgresql

# 9. Verify recovery
psql -U postgres -c "SELECT pg_is_in_recovery();"
```

## Testing Backups

### Automated Restore Test

```bash
#!/bin/bash
# scripts/test-restore.sh

set -euo pipefail

TEST_DB="restore_test_$(date +%s)"
S3_BUCKET="my-backups"

echo "Starting restore test at $(date)"

# Get latest backup
LATEST=$(aws s3 ls "s3://${S3_BUCKET}/postgres/" | sort | tail -n 1 | awk '{print $4}')
aws s3 cp "s3://${S3_BUCKET}/postgres/${LATEST}" "/tmp/${LATEST}"

# Create test database
createdb -h localhost -U postgres "${TEST_DB}"

# Restore to test database
pg_restore -h localhost -U postgres -d "${TEST_DB}" "/tmp/${LATEST}" || {
  echo "RESTORE FAILED"
  exit 1
}

# Verify row counts match
ORIGINAL_COUNT=$(psql -h localhost -U postgres -d mydb -t -c "SELECT COUNT(*) FROM users;")
RESTORED_COUNT=$(psql -h localhost -U postgres -d "${TEST_DB}" -t -c "SELECT COUNT(*) FROM users;")

if [[ "$ORIGINAL_COUNT" != "$RESTORED_COUNT" ]]; then
  echo "ROW COUNT MISMATCH: original=${ORIGINAL_COUNT}, restored=${RESTORED_COUNT}"
  exit 1
fi

# Cleanup
dropdb -h localhost -U postgres "${TEST_DB}"
rm "/tmp/${LATEST}"

echo "Restore test PASSED at $(date)"
```

## Monitoring Backup Status

### Prometheus Exporter

Use postgres_exporter with backup metrics.

### Alerting Rules

```yaml
groups:
  - name: backup_alerts
    rules:
      - alert: PostgresBackupMissing
        expr: time() - pg_backup_last_success_timestamp > 86400 * 2
        for: 1h
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL backup hasn't succeeded in 2 days"

      - alert: PostgresWalArchivingFailing
        expr: rate(pg_stat_archiver_failed_count[5m]) > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "WAL archiving is failing"
```

## Retention Policy

| Backup Type | Retention | Storage |
|---|---|---|
| Hourly logical dumps | 24 hours | Local + S3 |
| Daily logical dumps | 30 days | S3 |
| Weekly base backups | 12 weeks | S3 Glacier |
| WAL segments | 7 days | S3 |
| Point-in-time window | 7 days | S3 |

## Quick Reference

```bash
# Manual logical backup
pg_dump -Fc mydb > mydb.dump

# Manual restore
pg_restore -d mydb mydb.dump

# Check archive status
SELECT * FROM pg_stat_archiver;

# Check replication slots
SELECT * FROM pg_replication_slots;

# Force a checkpoint
CHECKPOINT;
```
