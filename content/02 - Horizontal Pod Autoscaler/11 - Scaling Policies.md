---
title: 11 - Scaling Policies
description: Learn how the Horizontal Pod Autoscaler controls the speed and behavior of scaling operations.
---

# 11 - Scaling Policies

Until now, we have focused on **when** the HPA decides to scale. An equally important question is: **how fast should scaling occur?**

Without restrictions, the HPA could react aggressively to every metric change. A brief CPU spike lasting a few seconds could trigger dozens of Pods to be created and then immediately removed — a pattern known as **thrashing** or **flapping**. This wastes compute resources and negatively impacts application performance, cluster stability, and infrastructure costs.

**Scaling Policies** determine how many replicas can be added or removed during each scaling operation, making autoscaling more predictable and stable.

---

## The `behavior` Section

Scaling behaviour is configured using the `behavior` field of the HPA resource:

```yaml
spec:
  behavior:
    scaleUp:
      # ...
    scaleDown:
      # ...
```

Each direction can be configured independently, allowing applications to scale up aggressively while scaling down conservatively — the recommended approach for most production workloads.

---

## Scale-Up Policies

### Percentage-Based

```yaml
behavior:
  scaleUp:
    policies:
      - type: Percent
        value: 100
        periodSeconds: 60
```

Allows the HPA to **double** the number of replicas every minute:

```
Minute 0:  4 Pods
Minute 1:  8 Pods
Minute 2: 16 Pods
Minute 3: 32 Pods
```

### Fixed Replica Count

```yaml
behavior:
  scaleUp:
    policies:
      - type: Pods
        value: 4
        periodSeconds: 60
```

Kubernetes may add at most **4 Pods per minute**, regardless of workload size. Provides predictable scaling for applications with expensive startup times.

---

## Scale-Down Policies

Scale-down policies work identically. Example removing at most 20% of replicas per minute:

```yaml
behavior:
  scaleDown:
    policies:
      - type: Percent
        value: 20
        periodSeconds: 60
```

With 20 Pods running, Kubernetes removes at most 4 Pods per interval — decreasing gradually rather than dropping immediately to the minimum.

---

## Combining Multiple Policies

Multiple policies can coexist within the same direction:

```yaml
behavior:
  scaleUp:
    policies:
      - type: Percent
        value: 100
        periodSeconds: 60
      - type: Pods
        value: 5
        periodSeconds: 60
```

The `selectPolicy` field determines which is applied:

```yaml
behavior:
  scaleUp:
    selectPolicy: Max
```

| Option | Behaviour |
|---|---|
| `Max` | Use the most aggressive policy (default) |
| `Min` | Use the most conservative policy |
| `Disabled` | Disable scaling in that direction entirely |

**Example with `selectPolicy: Max`** (current: 10 replicas):

```
100% policy → 20 Pods
Pods +5     → 15 Pods

selectPolicy: Max → 20 Pods chosen
```

**With `selectPolicy: Min` → 15 Pods chosen**

---

## Disabling a Direction

```yaml
behavior:
  scaleDown:
    selectPolicy: Disabled
```

Useful during deployments or maintenance windows when you want to prevent the HPA from reducing replicas.

---

## Typical Production Configuration

Most production clusters follow the same philosophy:

```
Scale Up   → Fast   → Protect availability
Scale Down → Slow   → Protect stability
```

Applications tolerate temporary over-provisioning far better than insufficient capacity:

```yaml
behavior:
  scaleUp:
    policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    selectPolicy: Max

  scaleDown:
    policies:
      - type: Percent
        value: 10
        periodSeconds: 120
    selectPolicy: Min
```

---

## Percentage vs Fixed Replicas

| | Percentage | Fixed Pods |
|---|---|---|
| Best for | Large, variable workloads | Small, predictable workloads |
| Scales with | Workload size | Absolute count |
| Predictability | Lower | Higher |
| Cloud-native fit | High | Moderate |

---

## Best Practices

> [!tip]
> Configure aggressive scale-up policies to react quickly to sudden increases in demand.

> [!tip]
> Use conservative scale-down policies to avoid oscillations and protect stability.

> [!tip]
> Percentage-based scaling generally works better for large deployments where fixed counts become impractical.

> [!warning]
> Excessively aggressive policies may create large numbers of Pods in a short time, potentially exhausting cluster resources if the Cluster Autoscaler cannot provision nodes fast enough.

> [!note]
> Scaling Policies control **how fast** scaling occurs — not **when**. Metric thresholds still determine when a scaling decision is triggered.

---

## Key Takeaways

- Scaling Policies control the rate at which the HPA changes replica counts
- Scale-up and scale-down behaviour are configured independently in the `behavior` section
- Policies can use percentages or fixed replica counts
- Multiple policies can coexist; `selectPolicy` (`Max`, `Min`, `Disabled`) determines which applies
- Most production systems scale up aggressively and scale down conservatively
