---
title: 04 - Ladder Scaling Algorithm
description: Learn how the Cluster Proportional Autoscaler uses the Ladder scaling algorithm to scale infrastructure workloads in predefined steps.
---

# 04 - Ladder Scaling Algorithm

While the **Linear** algorithm increases replicas proportionally with cluster size, the **Ladder** algorithm follows a different approach. Instead of calculating replicas using a mathematical formula, it uses **predefined scaling thresholds** — each representing a cluster size range and the corresponding number of replicas that should be deployed.

This creates a predictable **step-by-step** scaling behavior.

---

## Why Use Ladder Scaling?

Not every infrastructure service grows in a perfectly linear fashion. A monitoring service at 10 nodes running 2 replicas may not justify a third replica just because the cluster reaches 12 nodes. It may make more operational sense to wait until the cluster reaches 20 nodes before adding capacity. The Ladder algorithm is designed for this type of workload.

---

## The Basic Concept

Instead of a formula, Ladder scaling uses a lookup table:

| Cluster Size | Desired Replicas |
|---|---:|
| 1–10 Nodes | 2 |
| 11–25 Nodes | 3 |
| 26–50 Nodes | 5 |
| 51–100 Nodes | 8 |

Whenever the cluster crosses one of these thresholds, the CPA updates the Deployment.

---

## Visual Representation

```
Replicas

8 ┤                    ┌──────────
5 ┤           ┌────────┘
3 ┤     ┌─────┘
2 ┤─────┘
  └──────────────────────────────► Nodes
       10    25     50      100
```

Unlike Linear scaling, the replica count changes only when a threshold is reached — the characteristic "staircase" pattern.

---

## Example

Ladder configured as: `10 → 2 replicas`, `20 → 3 replicas`, `40 → 5 replicas`:

| Cluster Size | Replicas |
|---|---|
| 8 Nodes | 2 |
| 18 Nodes | 3 |
| 35 Nodes | 5 |

The replica count changes only when entering a new range.

---

## Why Not Scale Continuously?

If nodes are frequently added and removed around a boundary:

```
10 Nodes → 11 Nodes → 10 Nodes → 11 Nodes ...
```

With a formula-based approach, infrastructure services might repeatedly scale up and down. The Ladder algorithm avoids these unnecessary adjustments by grouping cluster sizes into ranges, improving workload stability.

---

## Configuration Concept

> [!note]
> The configuration below is simplified for clarity. The actual CPA uses JSON arrays in a ConfigMap — the format is covered in the CPA Configuration page.

```yaml
ladder:
  - nodes: 10
    replicas: 2
  - nodes: 25
    replicas: 3
  - nodes: 50
    replicas: 5
  - nodes: 100
    replicas: 8
```

Each entry defines a scaling threshold. When the cluster reaches or exceeds a threshold, the corresponding replica count is applied.

---

## Scaling Timeline

Configured ladder: `10 → 2`, `25 → 3`, `50 → 5`, `100 → 8`.

| Nodes | Replicas |
|---|---|
| 5 | 2 |
| 12 | 3 |
| 18 | 3 |
| 27 | 5 |
| 45 | 5 |
| 70 | 8 |

Several cluster sizes share the same replica count — this is the intended behavior.

---

## Linear vs Ladder

| Linear | Ladder |
|---|---|
| Continuous scaling | Step-based scaling |
| Formula-driven | Threshold-driven |
| Smooth replica growth | Fixed scaling levels |
| Better for gradual growth | Better for stable infrastructure |

Neither algorithm is universally better — the appropriate choice depends on workload characteristics.

---

## When to Use Ladder Scaling

The Ladder algorithm works particularly well when:
- Infrastructure services do not require frequent scaling
- Scaling should occur only after meaningful cluster growth
- Stable replica counts are preferred over precise proportionality

Typical examples: CoreDNS, admission controllers, monitoring services, logging aggregators.

---

## Advantages

**Stable replica counts** — Minor cluster changes do not immediately trigger scaling events.

**Easier capacity planning** — Operations teams know exactly how many replicas exist at each cluster size.

**Fewer scaling events** — Replica counts change only at predefined thresholds, resulting in fewer Deployment rollouts.

---

## Limitations

Thresholds can produce relatively large jumps at boundaries:

```
24 Nodes  →  3 Replicas
25 Nodes  →  5 Replicas
```

A single node addition may trigger a significant scaling event. This behavior is expected — the algorithm intentionally prioritizes stability over precision.

---

## Choosing Between Linear and Ladder

Use **Linear** when workload demand increases gradually and proportional scaling is desirable.

Use **Ladder** when infrastructure requirements change in distinct stages and minimizing scaling events is more important than precise proportionality.

---

## Best Practices

> [!tip]
> Choose threshold values that reflect meaningful changes in cluster capacity rather than arbitrary numbers.

> [!tip]
> Review thresholds periodically as the cluster grows and workload patterns evolve.

> [!tip]
> Keep the number of scaling levels manageable — a small number of well-defined thresholds is easier to operate than many finely tuned stages.

> [!warning]
> Large gaps between thresholds may delay necessary scaling, while thresholds that are too close together reduce the stability benefits of the Ladder algorithm.

> [!note]
> The Ladder algorithm is deterministic — a given cluster size always maps to the same predefined replica count.

---

## Key Takeaways

- The Ladder algorithm scales workloads using predefined thresholds instead of mathematical formulas
- Replica counts change only when the cluster enters a new size range
- This reduces unnecessary scaling events and improves workload stability
- Ladder scaling suits infrastructure services whose resource requirements grow in distinct stages
- Choosing between Linear and Ladder depends on whether proportional growth or operational stability is the primary objective
