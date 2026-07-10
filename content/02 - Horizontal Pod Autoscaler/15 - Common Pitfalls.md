---
title: 15 - Common Pitfalls
description: Discover the most common mistakes when configuring the Horizontal Pod Autoscaler and learn how to avoid them.
---

# 15 - Common Pitfalls

The HPA is easy to configure, but achieving reliable autoscaling in production requires more than creating an HPA resource. Many scaling issues are not caused by Kubernetes — they result from poor application design, incorrect metrics, or unrealistic expectations.

---

## Mistake 1 — Missing Resource Requests

Defining limits without requests is one of the most frequent mistakes:

```yaml
# Wrong — limits only, no requests
resources:
  limits:
    cpu: "1"
    memory: 1Gi
```

The Metrics Server can still report raw CPU usage, but Kubernetes cannot calculate utilization and the HPA cannot make scaling decisions.

```yaml
# Correct
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: "1"
    memory: 1Gi
```

> [!tip]
> CPU-based autoscaling requires CPU **requests** — not limits.

---

## Mistake 2 — Choosing the Wrong Metric

Not every metric reflects application demand. An API spending most of its time waiting for database queries may show:

```
CPU: 15%      ← suggests no scaling needed
Requests/s: 4,500  ← suggests the opposite
```

Choose metrics that represent **actual workload demand**, not infrastructure utilization.

---

## Mistake 3 — Ignoring Application Startup Time

If an application takes 4 minutes to start, new Pods created by HPA won't help users immediately. During that window, existing Pods remain overloaded.

Mitigations: optimize initialization, preload required resources, minimize startup dependencies, maintain sufficient baseline capacity (`minReplicas`).

---

## Mistake 4 — Scaling Stateful Applications Horizontally

Not every workload benefits from more replicas. Databases, distributed caches, applications with local state, and software requiring persistent sessions can suffer from:

- Data consistency issues
- Synchronization overhead
- Session affinity problems

For these, VPA or application-specific clustering strategies are often more appropriate.

---

## Mistake 5 — Setting Unrealistic Replica Limits

```yaml
minReplicas: 1
maxReplicas: 500
```

Ask: Can the cluster run 500 Pods? Will the application function correctly at that scale? Is there budget? Replica limits should be based on expected traffic, cluster size, budget, and SLOs.

---

## Mistake 6 — Scaling Up Too Aggressively

```yaml
scaleUp:
  policies:
    - type: Percent
      value: 400
      periodSeconds: 60
```

Quadrupling replicas per minute can cause image pull storms, scheduling pressure, and node exhaustion. Scaling should be fast — but controlled.

---

## Mistake 7 — Scaling Down Too Quickly

Aggressive scale-down is often more dangerous than aggressive scale-up:

```
Traffic drops → Pods removed → Traffic returns → Pods recreated → repeat
```

This repeated cycle causes unnecessary container startups, latency spikes, and cache misses. Use stabilization windows and conservative scale-down policies.

---

## Mistake 8 — Forgetting the Cluster Autoscaler

HPA only changes desired Pod count — it does **not** provision nodes:

```
HPA creates 20 Pods → Scheduler: no nodes available → Pods remain Pending
```

HPA did its job correctly; the bottleneck is cluster capacity. Production environments should combine HPA with the Cluster Autoscaler.

---

## Mistake 9 — Assuming More Pods Always Improve Performance

More replicas don't help if the bottleneck is elsewhere:

```
More Pods → All hit the same DB → Max connections reached → Same throughput
```

Identify where the actual bottleneck is before introducing autoscaling.

---

## Mistake 10 — Not Monitoring Autoscaling

Applications, traffic patterns, and infrastructure evolve. An HPA that worked well six months ago may no longer be appropriate. Monitor continuously:

```bash
kubectl get hpa
kubectl describe hpa <name>
kubectl top pods
```

Track: replica count, scaling events, failed scaling attempts, pending Pods, average startup time, request latency.

---

## Mistake 11 — Using CPU for Every Workload

CPU is often the default choice, but many workloads have better signals:

| Workload | Better Metric |
|---|---|
| Kafka Consumer | Consumer lag |
| RabbitMQ Worker | Queue length |
| REST API | Requests/sec |
| Payment System | Transactions/sec |
| Video Processing | Active jobs |
| Notification Service | Pending messages |

Choosing the right metric is often the single most important autoscaling decision.

---

## Mistake 12 — Expecting Instant Scaling

Autoscaling is inherently reactive and involves delay:

```
Traffic increases
→ Metrics collected
→ HPA evaluates (15s interval)
→ Deployment updated
→ Pod scheduled
→ Container starts
→ Readiness probe succeeds
→ Traffic reaches new Pod
```

For workloads with predictable traffic patterns, **scheduled scaling** (pre-scaling before known peak hours) may complement reactive HPA.

---

## Summary

Most HPA problems are caused by:

- Poor metric selection
- Missing resource requests
- Unrealistic replica limits
- Insufficient cluster capacity
- Application design not suited to horizontal scaling

Understanding these pitfalls helps design autoscaling strategies that remain stable, predictable, and cost-effective.

---

## Key Takeaways

- Always define CPU and memory requests on every container
- Select metrics that reflect real workload demand, not infrastructure utilization
- Ensure applications start quickly — HPA can only help if new Pods are ready quickly
- Avoid aggressive scale-down — oscillation is expensive
- HPA cannot provision nodes — combine with Cluster Autoscaler
- Monitor continuously; autoscaling is not "set and forget"
- Validate scaling behaviour through load testing before production
