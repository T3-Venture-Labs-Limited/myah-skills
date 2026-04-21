---
name: microservices-patterns
description: Implement proven microservices patterns including service discovery, circuit breakers, distributed tracing, event-driven architecture, and saga transactions for reliable distributed systems.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: development
  tags:
    - microservices
    - distributed-systems
    - architecture
    - patterns
    - events
  personas:
    developer: 80
    researcher: 50
    analyst: 35
    operator: 65
    creator: 20
    support: 40
  summary: Master microservices patterns for building resilient distributed systems
  featured: false
  requires:
    tools: [file-read, file-write]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Microservices Patterns

Building distributed systems requires solving problems like service discovery, fault tolerance, and data consistency.

## Service Discovery

### Client-Side Discovery

```python
import requests

class ServiceDiscovery:
    def __init__(self, registry_url):
        self.registry_url = registry_url
    
    def get_service_url(self, service_name):
        instances = requests.get(
            f"{self.registry_url}/instances/{service_name}"
        ).json()
        
        # Simple round-robin
        return instances[0]['url']
```

### Server-Side Discovery

```nginx
# API Gateway routes requests
location /users/ {
    proxy_pass http://users-service:3000/;
}
```

## Circuit Breaker

```python
import time
from enum import Enum

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.last_failure_time = None
    
    def call(self, func, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time > self.timeout:
                self.state = CircuitState.HALF_OPEN
            else:
                raise CircuitOpenException()
        
        try:
            result = func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise
    
    def on_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED
    
    def on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
```

## API Gateway

```python
from fastapi import FastAPI, Request
from proxy.p import httpx

app = FastAPI()

@app.middleware("/api")
async def proxy(request: Request, call_next):
    path = request.url.path
    
    if path.startswith("/api/users"):
        target = "http://users-service:3000"
    elif path.startswith("/api/orders"):
        target = "http://orders-service:3001"
    else:
        target = "http://default-service:3002"
    
    response = await httpx.AsyncClient().proxy(
        f"{target}{path}",
        method=request.method,
        headers=dict(request.headers),
        content=await request.body()
    )
    
    return Response(content=response.content, status_code=response.status_code)
```

## Event-Driven Architecture

### Message Publisher

```python
import json
import pika

def publish_event(exchange, event_type, payload):
    connection = pika.BlockingConnection(pika.URLParameters('amqp://localhost'))
    channel = connection.channel()
    
    channel.exchange_declare(exchange=exchange, exchange_type='topic')
    
    channel.basic_publish(
        exchange=exchange,
        routing_key=event_type,
        body=json.dumps(payload),
        properties=pika.BasicProperties(
            content_type='application/json',
            delivery_mode=2  # Persistent
        )
    )
    
    connection.close()

# Usage
publish_event('orders', 'order.created', {
    'order_id': '123',
    'user_id': '456',
    'total': 99.99
})
```

### Event Subscriber

```python
def consume_events():
    connection = pika.BlockingConnection(pika.URLParameters('amqp://localhost'))
    channel = connection.channel()
    
    channel.exchange_declare(exchange='orders', exchange_type='topic')
    channel.queue_declare(queue='email-service')
    channel.queue_bind(exchange='orders', queue='email-service', routing_key='order.*')
    
    def callback(ch, method, properties, body):
        event = json.loads(body)
        print(f"Received: {method.routing_key}", event)
        
        if method.routing_key == 'order.created':
            send_confirmation_email(event['user_id'])
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
    
    channel.basic_consume(queue='email-service', on_message_callback=callback)
    channel.start_consuming()
```

## Saga Pattern (Distributed Transactions)

### Choreography-Based Saga

```python
# Order Service
def create_order(user_id, items):
    order = db.create_order(user_id, items, status='pending')
    
    publish_event('orders', 'order.pending', {
        'order_id': order.id,
        'user_id': user_id
    })
    
    return order

# Inventory Service subscribes
def handle_order_pending(event):
    if not reserve_inventory(event['items']):
        publish_event('orders', 'order.inventory_failed', {
            'order_id': event['order_id']
        })
    else:
        publish_event('orders', 'order.inventory_reserved', {
            'order_id': event['order_id']
        })

# Payment Service subscribes
def handle_inventory_reserved(event):
    if not charge_payment(event['user_id'], event['total']):
        publish_event('orders', 'order.payment_failed', {
            'order_id': event['order_id']
        })

# Compensating transactions
def handle_payment_failed(event):
    release_inventory(event['order_id'])
    cancel_order(event['order_id'])
```

## Distributed Tracing

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

@app.get("/users/{user_id}")
def get_user(user_id: str):
    with tracer.start_as_current_span("get_user") as span:
        span.set_attribute("user.id", user_id)
        
        with tracer.start_as_current_span("db_query"):
            user = db.get_user(user_id)
        
        with tracer.start_as_current_span("serialize"):
            return user.to_dict()
```

## Retry with Exponential Backoff

```python
import time

def retry_with_backoff(func, max_retries=3, base_delay=1):
    for attempt in range(max_retries):
        try:
            return func()
        except RetryableError as e:
            if attempt == max_retries - 1:
                raise
            
            delay = base_delay * (2 ** attempt)
            time.sleep(delay)
```
