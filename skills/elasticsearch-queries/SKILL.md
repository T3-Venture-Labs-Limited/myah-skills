---
name: elasticsearch-queries
description: Query Elasticsearch using Query DSL for full-text search, aggregations, and analytics. Build efficient search queries with filters, sorting, and pagination.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: analytics
  tags:
    - elasticsearch
    - search
    - aggregations
    - analytics
    - query-dsl
  personas:
    developer: 70
    researcher: 55
    analyst: 75
    operator: 45
    creator: 25
    support: 30
  summary: Master Elasticsearch Query DSL for powerful full-text search and analytics
  featured: false
  requires:
    tools: [command-exec, file-read]
    mcp: []
    env: [ELASTICSEARCH_URL]
  author:
    name: Myah Team
    url: https://myah.dev
---

# Elasticsearch Query DSL

Elasticsearch is a distributed search and analytics engine. This skill covers common query patterns.

## Python Client Setup

```python
from elasticsearch import Elasticsearch

es = Elasticsearch([os.environ.get('ELASTICSEARCH_URL', 'http://localhost:9200')])

# Check cluster health
print(es.cluster.health())
```

## Basic Queries

### Match All

```python
es.search(index='my-index', body={'query': {'match_all': {}}})
```

### Match Query (full-text search)

```python
es.search(index='my-index', body={
    'query': {
        'match': {
            'title': 'elasticsearch guide'
        }
    }
})
```

### Term Query (exact match)

```python
es.search(index='my-index', body={
    'query': {
        'term': {
            'status': 'published'
        }
    }
})
```

### Multi-Match Query

```python
es.search(index='my-index', body={
    'query': {
        'multi_match': {
            'query': 'search term',
            'fields': ['title^2', 'description', 'content'],
            'type': 'best_fields'
        }
    }
})
```

## Boolean Queries

```python
es.search(index='my-index', body={
    'query': {
        'bool': {
            'must': [
                {'match': {'title': 'elasticsearch'}}
            ],
            'should': [
                {'match': {'content': 'tutorial'}},
                {'range': {'views': {'gte': 1000}}}
            ],
            'must_not': [
                {'term': {'status': 'draft'}}
            ],
            'filter': [
                {'range': {'publish_date': {'gte': '2024-01-01'}}}
            ]
        }
    }
})
```

## Aggregations

```python
es.search(index='my-index', body={
    'size': 0,  # Don't return hits, just aggregations
    'aggs': {
        'status_counts': {
            'terms': {'field': 'status'}
        },
        'avg_views': {
            'avg': {'field': 'views'}
        },
        'views_histogram': {
            'histogram': {'field': 'views', 'interval': 1000}
        },
        'content_types': {
            'terms': {'field': 'content_type.keyword'}
        }
    }
})
```

## Pagination and Sorting

```python
es.search(index='my-index', body={
    'from': 20,
    'size': 10,
    'query': {'match_all': {}},
    'sort': [
        {'publish_date': {'order': 'desc'}},
        {'_score': {'order': 'desc'}}
    ]
})
```

## Highlighting

```python
es.search(index='my-index', body={
    'query': {'match': {'content': 'search term'}},
    'highlight': {
        'fields': {
            'content': {
                'fragment_size': 150,
                'number_of_fragments': 3
            }
        },
        'pre_tags': ['<em>'],
        'post_tags': ['</em>']
    }
})
```

## Indexing Documents

```python
# Single document
es.index(index='my-index', id='doc-123', body={
    'title': 'Getting Started with Elasticsearch',
    'content': 'Elasticsearch is a distributed search engine...',
    'tags': ['search', 'elasticsearch'],
    'views': 1500,
    'publish_date': '2024-01-15'
})

# Bulk indexing
from elasticsearch.helpers import bulk

actions = [
    {'_index': 'my-index', '_id': f'doc-{i}', '_source': {'title': f'Doc {i}'}}
    for i in range(100)
]
bulk(es, actions)
```

## Mappings

```python
es.indices.create(index='my-index', body={
    'mappings': {
        'properties': {
            'title': {'type': 'text', 'analyzer': 'english'},
            'status': {'type': 'keyword'},
            'views': {'type': 'integer'},
            'publish_date': {'type': 'date'},
            'tags': {'type': 'keyword'}
        }
    }
})
```

## Tips

- Use `filter` context for non-scoring queries (faster)
- Limit returned fields with `_source` parameter
- Use `bulk` API for indexing many documents
- Set `refresh=true` only when immediately needed
