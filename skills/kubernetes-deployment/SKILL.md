---
name: kubernetes-deployment
description: Deploy and manage applications on Kubernetes with manifests, Helm charts, rolling updates, and health checks. Configure pods, services, ingress, and persistent storage.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - kubernetes
    - k8s
    - deployment
    - containers
    - orchestration
  personas:
    developer: 60
    researcher: 30
    analyst: 20
    operator: 95
    creator: 20
    support: 45
  summary: Deploy and manage containerized applications on Kubernetes with manifests and Helm
  featured: false
  requires:
    tools: [command-exec, file-read, file-write]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Kubernetes Deployment

Kubernetes is the standard for container orchestration. This skill covers common deployment patterns.

## Basic Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: myregistry/myapp:v1.0.0
          ports:
            - containerPort: 8080
          resources:
            limits:
              memory: "256Mi"
              cpu: "500m"
            requests:
              memory: "128Mi"
              cpu: "250m"
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 15
```

## Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  selector:
    app: myapp
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: ClusterIP  # or LoadBalancer, NodePort
```

## Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-service
                port:
                  number: 80
  tls:
    - hosts:
        - myapp.example.com
      secretName: myapp-tls
```

## ConfigMap and Secrets

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  DATABASE_HOST: "db-service"
  LOG_LEVEL: "info"
---
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
type: Opaque
stringData:
  DATABASE_PASSWORD: "supersecret"
  API_KEY: "sk-live-xxx"
```

## Helm Chart Structure

```
mychart/
  Chart.yaml
  values.yaml
  templates/
    deployment.yaml
    service.yaml
    ingress.yaml
    _helpers.tpl
```

## Helm Commands

```bash
# Install chart
helm install myapp ./mychart

# Upgrade
helm upgrade myapp ./mychart

# Rollback
helm rollback myapp 1

# List releases
helm list

# Dry run
helm install --dry-run --debug myapp ./mychart

# Template rendering
helm template myapp ./mychart
```

## Rolling Updates

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

```bash
# Update image
kubectl set image deployment/myapp myapp=myregistry/myapp:v1.1.0

# Check rollout status
kubectl rollout status deployment/myapp

# View history
kubectl rollout history deployment/myapp

# Undo rollout
kubectl rollout undo deployment/myapp
```

## Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Persistent Storage

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: myapp-storage
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: myapp
          volumeMounts:
            - name: storage
              mountPath: /data
      volumes:
        - name: storage
          persistentVolumeClaim:
            claimName: myapp-storage
```

## Common Commands

```bash
kubectl get pods
kubectl get services
kubectl get deployments
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl exec -it <pod-name> -- /bin/sh
kubectl apply -f manifest.yaml
kubectl delete -f manifest.yaml
kubectl scale deployment myapp --replicas=5
kubectl port-forward service/myapp 8080:80
```
