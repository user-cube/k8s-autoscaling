---
title: 13 - Scaling Behavior
description: Understand how the Horizontal Pod Autoscaler behaves during scale-up and scale-down operations, and why its behavior differs in each direction.
---

# 13 - Scaling Behavior

The HPA does not simply add or remove Pods whenever a metric crosses its target. Kubernetes follows a carefully designed strategy that balances two competing goals:

- **React quickly to increasing demand** — to protect availability
- **Avoid unnecessary scaling during decreasing demand** — to protect stability

Scaling too slowly may impact availability; scaling too aggressively may waste resources and destabilize workloads. For this reason, Kubernetes intentionally treats **scale-up** and **scale-down** as two different operations.

---

## The Scaling Lifecycle

```mermaid
flowchart LR

A[Collect Metrics] --> B[Compare Against Target] --> C[Calculate Desired Replicas] --> D[Apply Stabilization Window] --> E[Apply Scaling Policy] --> F[Update Deployment]
```

Calculating the desired replica count is only one part of the process. Before updating the Deployment, Kubernetes also evaluates stabilization rules, scaling policies, and replica limits.

---

## Scale-Up Behavior

When workload demand increases, Kubernetes provides additional capacity as quickly as possible.

```
Target CPU: 70%
Observed:   94%
Current:    6 Pods → Desired: 12 Pods → Immediately updated
```

**Why is scale-up aggressive?** Insufficient capacity directly affects users — increased latency, request timeouts, failed transactions, overloaded Pods. Temporary over-provisioning is preferable to application downtime.

---

## Scale-Down Behavior

Scale-down aims to reduce costs **without compromising stability**.

```
Current replicas: 10
Average CPU:       18%
Desired replicas:   3
```

Instead of immediately removing 7 Pods, Kubernetes checks the stabilization window, scale-down policies, and minimum replica count before acting.

**Why is scale-down conservative?** Traffic often decreases temporarily (lunch breaks, off-peak hours) and returns shortly after. Removing and recreating Pods wastes time and cluster resources. Keeping existing Pods for a short period is usually more efficient.

---

## Scale-Up vs Scale-Down

| | Scale-Up | Scale-Down |
|---|---|---|
| Priority | Application availability | Stability and efficiency |
| Speed | Immediate | Delayed |
| Approach | Aggressive | Conservative |
| Action | Creates Pods | Removes Pods |

This asymmetry is intentional. Production workloads benefit more from temporary over-provisioning than from aggressive cost optimisation.

---

## Example Timeline

```
09:00  CPU 35%  →  4 Pods  (stable)
09:10  CPU 82%  →  8 Pods  (scale-up, fast)
09:20  CPU 93%  → 12 Pods  (scale-up, fast)
09:40  CPU 25%  → 12 Pods  (waiting — stabilization window)
09:45  CPU 20%  → 10 Pods  (gradual scale-down begins)
09:50  CPU 18%  →  8 Pods  (continues gradually)
```

Scale-up is near-immediate; scale-down is gradual. This is exactly the behaviour Kubernetes is designed to produce.

---

## Replica Limits

Every scaling operation must respect the configured limits regardless of metric values:

```yaml
minReplicas: 3
maxReplicas: 15
```

```
Desired replicas = 20  →  Final: 15  (capped at max)
Desired replicas =  1  →  Final:  3  (enforced at min)
```

Replica limits always override scaling recommendations.

---

## What Happens When Metrics Fluctuate?

```
72% → 69% → 71% → 68% → 70%
```

Without safeguards, Kubernetes would oscillate. Instead:

- The **stabilization window** delays scale-down decisions
- **Scaling policies** limit how many replicas change per interval
- The **control loop** re-evaluates every 15 seconds

Together, these produce smooth behaviour even when metrics fluctuate around the target.

---

## Factors Influencing Scaling Behavior

| Component | Responsibility |
|---|---|
| Metrics | Determine workload demand |
| Control Loop | Evaluates metrics periodically |
| Stabilization Window | Prevents oscillation |
| Scaling Policies | Limits scaling speed |
| Replica Limits | Define minimum and maximum capacity |

Scaling behaviour is the result of all these mechanisms working together.

---

## Production Philosophy

```
Demand increases  →  Scale immediately
Demand decreases  →  Wait → Verify → Scale gradually
```

This strategy minimises user impact while avoiding unnecessary infrastructure costs.

---

## Best Practices

> [!tip]
> Design applications to start quickly — fast startup times make scale-up significantly more effective.

> [!tip]
> Configure readiness probes correctly so new Pods only receive traffic when they are actually ready.

> [!tip]
> Maintain some spare cluster capacity. If the Cluster Autoscaler must provision new nodes first, scaling will take longer.

> [!warning]
> Aggressive scale-down configurations reduce costs but often increase latency during recurring traffic spikes.

> [!note]
> Successful autoscaling is not about scaling as often as possible — it is about scaling at the right time and at the appropriate rate.

---

## Key Takeaways

- Scale-up and scale-down are intentionally asymmetric
- Kubernetes prioritises availability over immediate cost savings
- Scale-up is aggressive; scale-down is deliberately conservative
- Scaling behaviour results from the interaction of metrics, policies, stabilization windows, and replica limits
- Understanding this asymmetry is essential for designing predictable autoscaling strategies
