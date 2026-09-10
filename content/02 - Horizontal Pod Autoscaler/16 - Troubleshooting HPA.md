---
title: 16 - Troubleshooting HPA
description: A practical guide to diagnosing and resolving common Horizontal Pod Autoscaler issues in Kubernetes.
---

# 16 - Troubleshooting HPA

In production, there will inevitably be situations where an application does not scale as expected. The most effective approach is to follow the autoscaling pipeline from start to finish — if any component fails, autoscaling may stop working correctly.

```
Application → Metrics → Metrics Provider → Kubernetes API → HPA → Deployment → Pods → Scheduler → Worker Nodes
```

---

## Step 1 — Check the HPA

```bash
kubectl get hpa
```

```text
NAME           REFERENCE               TARGETS    MINPODS   MAXPODS   REPLICAS
frontend-hpa   Deployment/frontend     82%/70%    2         10        5
```

This immediately shows: current metric vs target, replica count, and scaling bounds. If these look incorrect, the problem is usually configuration-related.

---

## Step 2 — Describe the HPA

```bash
kubectl describe hpa frontend-hpa
```

Shows scaling events, current metrics, desired replicas, scaling conditions, and warnings:

```text
Conditions:
  AbleToScale=True
  ScalingActive=True
  ScalingLimited=False
```

These conditions provide valuable clues about the autoscaler's current state.

---

## Step 3 — Verify Metrics

```bash
kubectl top pods
```

```text
NAME          CPU    MEMORY
frontend-1    83m    110Mi
frontend-2    76m     95Mi
```

If this returns:

```text
error: Metrics API not available
```

the problem is the Metrics Server. Without metrics, the HPA cannot make any scaling decisions.

---

## Step 4 — Check Resource Requests

CPU-based autoscaling requires resource requests. Inspect the Deployment:

```bash
kubectl describe deployment frontend
```

Look for:

```yaml
resources:
  requests:
    cpu: 500m
```

Missing CPU requests produce the most common HPA symptom:

```text
TARGETS
<unknown>/70%
```

---

## Step 5 — Verify Replica Limits

The HPA may be working correctly but constrained by its own configuration. If demand requires 12 replicas but `maxReplicas: 5`, the HPA stops at 5 — this is expected behavior. Verify that configured limits match the application's expected workload.

---

## Step 6 — Check for Pending Pods

```bash
kubectl get pods
```

```text
frontend-8fd92   Pending
```

If Pods are `Pending`, the HPA has completed its work. The bottleneck is now the scheduler. Possible causes:

- Insufficient CPU or memory on existing nodes
- Node affinity rules or taints/tolerations
- Unavailable Worker Nodes

---

## Step 7 — Verify the Cluster Autoscaler

Pending Pods often indicate insufficient cluster capacity. If no new nodes are being created, investigate the Cluster Autoscaler rather than the HPA:

```
HPA → Deployment → Pending Pods → Cluster Autoscaler → New Node → Pods Scheduled
```

---

## Step 8 — Verify Custom or External Metrics

For HPAs using `type: Pods` or `type: External`, verify the Metrics Adapter is healthy. Common issues:

- Adapter unavailable
- Incorrect Prometheus queries
- Authentication failures
- Missing API registration

If the adapter cannot expose metrics through the Kubernetes API, the HPA cannot consume them.

---

## Step 9 — Review Events

```bash
kubectl describe hpa frontend-hpa
```

```text
Events:
  SuccessfulRescale  New size: 8  Reason: CPU utilization above target
```

Events explain exactly why a scaling action occurred — or why it did not.

---

## Common Symptoms

| Symptom | Likely Cause |
|---|---|
| `TARGETS: <unknown>/70%` | Metrics Server down, missing CPU requests, or Metrics Adapter unavailable |
| Replicas never change | Metric never exceeds threshold, incorrect target, stabilization window, or policy restrictions |
| Pods remain Pending | Insufficient cluster resources, Cluster Autoscaler issues, or scheduling constraints |
| Scaling too slow | Long startup time, conservative policies, stabilization window, or node provisioning delays |
| Scaling too frequently | Unstable metrics, aggressive policies, short stabilization window, or poor threshold choice |

---

## Useful Commands

```bash
kubectl get hpa                                          # HPA status
kubectl describe hpa <name>                              # Detailed info + events
kubectl top pods                                         # Pod metrics
kubectl top nodes                                        # Node metrics
kubectl describe deployment <name>                       # Check resource requests
kubectl get pods                                         # Check for Pending pods
kubectl get events --sort-by=.metadata.creationTimestamp # Recent cluster events
```

---

## Practical Troubleshooting Workflow

```
1. Is the HPA healthy?              → kubectl get hpa
2. Are metrics available?           → kubectl top pods
3. Are resource requests set?       → kubectl describe deployment
4. Is the HPA calculating replicas? → kubectl describe hpa
5. Is the Deployment updating?      → kubectl get deployment
6. Are Pods being created?          → kubectl get pods
7. Can the Scheduler place them?    → kubectl describe pod <pending-pod>
8. Does the cluster have capacity?  → check Cluster Autoscaler logs
```

Working through the pipeline systematically is far more effective than changing random configuration values.

---

## Key Takeaways

- Most HPA issues are caused by missing metrics or incorrect configuration
- Always verify metrics availability before investigating scaling logic
- `kubectl describe hpa` is the single most valuable troubleshooting command
- Pending Pods usually indicate scheduling or cluster capacity problems — not HPA failures
- Follow the autoscaling pipeline from metrics collection to Pod scheduling
