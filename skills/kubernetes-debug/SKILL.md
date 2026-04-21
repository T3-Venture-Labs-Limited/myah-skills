---
name: kubernetes-debug
description: Diagnose and resolve common issues in Kubernetes clusters and workloads. Covers pod failures, networking problems, resource exhaustion, and use of kubectl debug tools.
license: MIT
role: tool
version: 1.0.0
marketplace:
  category: operations
  tags:
    - kubernetes
    - k8s
    - debug
    - troubleshooting
    - kubectl
    - devops
  personas:
    developer: 70
    researcher: 40
    analyst: 50
    operator: 95
    creator: 15
    support: 80
  summary: Diagnose pod failures, networking issues, and resource problems in Kubernetes
  featured: false
  requires:
    tools: [file-read, file-write, command-exec, web-search]
    mcp: []
    env: []
  author:
    name: Myah Team
    url: https://myah.dev
---

# Kubernetes Debug

When a pod won't start, a service is unreachable, or a deployment is stuck,
this skill provides a systematic approach to diagnose and resolve the issue.

## The Debug Mindset

1. **Start with events** — Most failures leave clues in `kubectl describe`
2. **Check the obvious** — Image pull issues, resource limits, permissions
3. **Follow the traffic** — Networking issues require tracing from source to destination
4. **Compare with working** — Find a similar pod that works and diff

## Common Pod Issues

### Pod Stuck in Pending

```bash
kubectl get pod myapp-xxx -n namespace
kubectl describe pod myapp-xxx -n namespace
```

Look for:
- **CPU/memory limits** — No node has enough resources
- **PersistentVolume claims** — Volume not found or wrong access mode
- **Node selectors** — No node matches the selector
- **Taints/tolerations** — Pod doesn't tolerate the node's taint

Fix with:

```bash
# Check resource quotas
kubectl describe resourcequota -n namespace

# Check available resources
kubectl describe nodes | grep -A 5 "Allocated resources"

# Check PVC status
kubectl get pvc -n namespace
kubectl describe pvc myclaim -n namespace
```

### Pod Stuck in ImagePullBackOff

```bash
# Common causes
# 1. Wrong image name or tag
# 2. Image not in registry
# 3. Image pull secret missing
# 4. Registry authentication failed

# Check the exact error
kubectl describe pod myapp-xxx | grep -A 10 "Failed to pull"

# Verify image exists
docker pull your-image:tag

# If using private registry, check secret
kubectl get secret -n namespace | grep regcred
kubectl describe secret regcred -n namespace
```

### Pod Stuck in CrashLoopBackOff

```bash
# Get recent logs (before it crashes again)
kubectl logs myapp-xxx -n namespace --previous

# Check exit code
kubectl describe pod myapp-xxx | grep "Exit Code"

# Common exit codes:
# 127 = command not found
# 1 = application error (check app logs)
# 137 = OOMKilled (memory limit exceeded)
# 143 = SIGTERM (graceful shutdown timeout)
```

### OOMKilled (Exit Code 137)

```bash
# Check actual memory usage
kubectl top pod myapp-xxx -n namespace

# Check limits vs actual
kubectl get pod myapp-xxx -n namespace -o jsonpath='{
  range .spec.containers[*]}
  {"name": .name, "mem_req": .resources.requests.memory,
   "mem_lim": .resources.limits.memory}
  end'
kubectl top pod myapp-xxx -n namespace
```

## Networking Debug

### Service Has No Endpoints

```bash
# Verify selectors match pods
kubectl get service myapp -n namespace -o yaml | grep -A 5 selector

# Check if pods are running with the right labels
kubectl get pods -n namespace -l "app=myapp" --show-labels

# If using ExternalName service, check DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup myapp.namespace
```

### Cannot Reach External Service

```bash
# Check if pods have DNS
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
# Inside: nslookup google.com

# Check egress policies
kubectl get networkpolicy -n namespace

# Test from a specific pod
kubectl exec -it myapp-xxx -n namespace -- sh
# Inside: wget -O- http://google.com
```

### Ingress Issues

```bash
# Check ingress controller is running
kubectl get pods -n ingress-nginx -l app=ingress-nginx

# Check ingress resource
kubectl describe ingress myapp -n namespace

# Check load balancer status
kubectl get svc -n namespace

# Common issues:
# - TLS cert not ready (Issuer/-cert not found)
# - No matching ingress controller
# - Path conflict with another ingress
```

## Resource Debug

### Check Resource Quotas

```bash
# What's consuming namespace resources?
kubectl describe resourcequota -n namespace
kubectl describe limitrange -n namespace

# Check node resources
kubectl describe nodes | grep -E "Allocated resources|Allocatable"

# Top pods by resource usage
kubectl top pods -n namespace --sort-by=memory
kubectl top pods -n namespace --sort-by=cpu
```

### Evictions

```bash
# Check if pods were evicted
kubectl get events -n namespace | grep -i evict

# Common eviction reasons:
# - MemoryPressure
# - DiskPressure
# - PIDPressure

# Check node conditions
kubectl get nodes -o wide
kubectl describe node node-name | grep -A 20 "Conditions"
```

## Useful Debug Commands

### One-liners

```bash
# Find all pods in a bad state
kubectl get pods -n namespace | grep -v Running | grep -v Completed

# Tail logs for all pods with a label
kubectl logs -f -l app=myapp -n namespace --all-containers

# Execute into a running pod
kubectl exec -it myapp-xxx -n namespace -- sh

# Port-forward to local
kubectl port-forward myapp-xxx 8080:3000 -n namespace

# Copy files from pod
kubectl cp namespace/myapp-xxx:/app/logs ./logs

# Watch resources in real-time
kubectl get pods -n namespace -w
```

### Debug with Ephemeral Container (K8s 1.16+)

```bash
# Add a debug container to a running pod
kubectl debug myapp-xxx -it -n namespace --image=busybox --share-processes --copy-to=myapp-debug

# Check filesystem
kubectl exec -it myapp-debug -n namespace -- sh

# Cleanup debug container
kubectl debug myapp-xxx -n namespace --copy-to=myapp-debug --present-in-pod=myapp-debug --remove=true
```

### Generate a Cluster Dump

```bash
# Everything for a namespace
kubectl cluster-info dump --all-namespaces --output-directory=/tmp/cluster-dump
```

## Common Fixes

| Problem | Quick Fix |
|---|---|
| OOMKilled | Increase memory limit |
| CrashLoopBackOff | Check logs, fix app error |
| ImagePullBackOff | Verify image name, check secrets |
| Pending | Increase resources or adjust limits |
| Terminating stuck | `kubectl delete pod --force --grace-period=0` |
| CrashLoop with liveness | Check if app actually fails, disable probe for debug |
