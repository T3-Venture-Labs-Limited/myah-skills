---
name: python-debugging
description: Systematic Python debugging techniques using pdb, breakpoint, logging, and type hints. Diagnose crashes, memory leaks, and performance bottlenecks efficiently.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - python
    - debugging
    - pdb
    - logging
    - profiling
  personas:
    developer: 90
    researcher: 40
    analyst: 35
    operator: 45
    creator: 20
    support: 70
  summary: Master Python debugging with pdb, logging, and systematic diagnosis techniques
  featured: false
  requires:
    tools: [command-exec, file-read]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Python Debugging Techniques

Systematic approaches to finding and fixing Python bugs, from simple print statements to advanced profilers.

## breakpoint()

The modern debugging entry point:

```python
def calculate(items):
    breakpoint()  # drops into pdb
    return sum(items)
```

## pdb Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `n` | `next` | Execute next line |
| `s` | `step` | Step into function |
| `c` | `continue` | Continue to next breakpoint |
| `p` | `print` | Print variable value |
| `pp` | — | Pretty print |
| `l` | `list` | Show source context |
| `w` | `where` | Stack trace |
| `u` | `up` | Move up stack |
| `d` | `down` | Move down stack |
| `q` | `quit` | Exit debugger |

## Logging Module

```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s %(name)s: %(message)s'
)

logger = logging.getLogger(__name__)

def risky_operation(data):
    logger.debug(f"Input data: {data}")
    try:
        result = process(data)
        logger.info(f"Success: {result}")
        return result
    except Exception as e:
        logger.error(f"Failed: {e}", exc_info=True)
        raise
```

## Type Hints for Debugging

```python
from typing import Optional

def find_user(user_id: int) -> Optional[dict]:
    """Returns user dict or None if not found."""
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)
    return user if user else None
```

## Memory Debugging

```python
import tracemalloc

tracemalloc.start()

# ... your code ...

snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')

for stat in top_stats[:10]:
    print(stat)
```

## Common Patterns

### Debugging None results

```python
result = maybe_return_none()
if result is None:
    breakpoint()  # investigate why
```

### Debugging list operations

```python
items = transform_data(raw)
breakpoint()  # p items, len(items), items[:3]
```

### Debugging API responses

```python
response = requests.get(url)
breakpoint()  # p response.status_code, response.json()
```

## Post-Mortem Debugging

```python
import pdb
import traceback

try:
    risky_code()
except Exception:
    traceback.print_exc()
    pdb.post_mortem()
```
