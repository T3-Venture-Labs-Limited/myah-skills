---
name: aws-s3
description: Manage AWS S3 buckets for file storage, static website hosting, and backup workflows. Covers bucket policies, lifecycle rules, presigned URLs, and cross-region replication.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - aws
    - s3
    - storage
    - cloud
    - backup
  personas:
    developer: 60
    researcher: 25
    analyst: 30
    operator: 85
    creator: 20
    support: 45
  summary: Master AWS S3 for file storage, hosting, backups, and presigned URL generation
  featured: false
  requires:
    tools: [command-exec, file-read]
    mcp: []
    env: [AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION]
  author:
    name: Myah Team
    url: https://myah.dev
---

# AWS S3 Management

Amazon S3 is object storage built to store and retrieve any amount of data. This skill covers common operational tasks.

## Bucket Operations

### Create Bucket

```bash
aws s3 mb s3://my-app-bucket --region us-east-1
```

### List Buckets

```bash
aws s3 ls
aws s3 ls s3://my-app-bucket/
```

### Delete Bucket

```bash
aws s3 rb s3://my-app-bucket --force  # force removes all objects first
```

## Uploading and Downloading

### Upload File

```bash
aws s3 cp ./local-file.txt s3://my-app-bucket/path/to/file.txt
```

### Download File

```bash
aws s3 cp s3://my-app-bucket/path/to/file.txt ./local-file.txt
```

### Sync Directory

```bash
aws s3 sync ./dist s3://my-app-bucket/static/ --delete
```

The `--delete` flag removes files from target that don't exist in source.

## Presigned URLs

Generate temporary access URLs:

```python
import boto3

s3 = boto3.client('s3')

url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': 'my-bucket', 'Key': 'private/file.pdf'},
    ExpiresIn=3600  # seconds
)
```

## Static Website Hosting

```bash
aws s3 website s3://my-bucket \
    --index-document index.html \
    --error-document error.html
```

### Bucket Policy (public read for static site)

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::my-bucket/*"
  }]
}
```

## Lifecycle Rules

Automate archiving to S3 Glacier:

```python
import boto3

s3 = boto3.client('s3')

s3.put_bucket_lifecycle_configuration(
    Bucket='my-bucket',
    LifecycleConfiguration={
        'Rules': [{
            'ID': 'ArchiveOldLogs',
            'Prefix': 'logs/',
            'Status': 'Enabled',
            'Transitions': [{
                'Days': 30,
                'StorageClass': 'GLACIER'
            }]
        }]
    }
)
```

## Cross-Region Replication

Enable replication for disaster recovery:

```python
s3.put_bucket_replication(
    Bucket='my-bucket',
    ReplicationConfiguration={
        'Role': 'arn:aws:iam::123456789:role/replication-role',
        'Rules': [{
            'ID': 'ReplicateToUsWest',
            'Status': 'Enabled',
            'Destination': {
                'Bucket': 'arn:aws:s3:::my-bucket-us-west-2'
            }
        }]
    }
)
```

## Python SDK Usage

```python
import boto3
import datetime as dt

s3 = boto3.resource('s3')

# Upload with metadata
s3.Bucket('my-bucket').put_object(
    Key=f'uploads/{dt.date.today()}/file.pdf',
    Body=file_content,
    ContentType='application/pdf',
    Metadata={'user-id': '12345'}
)

# List objects with prefix
for obj in s3.Bucket('my-bucket').objects.filter(Prefix='exports/'):
    print(obj.key, obj.last_modified)
```
