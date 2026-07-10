---
title: 03 - Linear Scaling Algorithm
description: Learn how the Cluster Proportional Autoscaler calculates replica counts using the Linear scaling algorithm.
---

# 03 - Linear Scaling Algorithm

The **Linear** algorithm is the most commonly used scaling strategy supported by the Cluster Proportional Autoscaler (CPA). Its objective is straightforward:

> Increase the number of replicas proportionally as the Kubernetes cluster grows.

Instead of relying on CPU utilization or application metrics, the CPA calculates the desired number of replicas using a mathematical relationship between cluster size and configured scaling parameters. This produces predictable and deterministic scaling behavior.

---

## Why Linear Scaling?

Many infrastructure services grow at approximately the same rate as the Kubernetes cluster. Consider CoreDNS — as more workloads are scheduled, DNS traffic increases proportionally. Linear scaling ensures infrastructure services grow gradually and automatically alongside the cluster.

---

## The Scaling Formula

```
Desired Replicas = ceil(Cluster Size / Scaling Factor)
```

The scaling factor determines how many replicas should exist for a given amount of cluster capacity. For example: **1 replica per 4 Worker Nodes**.

---

## Scaling Example

Initial cluster with 4 Worker Nodes, factor of 1 per 4 nodes:

```
ceil(4 / 4) = 1 Replica
```

Cluster expands to 12 Worker Nodes:

```
ceil(12 / 4) = 3 Replicas
```

The CPA updates the Deployment accordingly.

---

## Scaling with CPU Cores

The Linear algorithm is not limited to node count — it can also scale according to total CPU cores available in the cluster:

```
Cluster CPU: 64 Cores
Factor: 1 Replica per 16 CPU Cores

ceil(64 / 16) = 4 Replicas
```

This approach is useful when node sizes differ significantly between clusters.

---

## Why CPU-Based Scaling?

Consider two clusters with the same number of nodes but very different capacities:

```
Cluster A: 8 Nodes × 4 CPU  =  32 CPU
Cluster B: 8 Nodes × 16 CPU = 128 CPU
```

Node-count scaling would recommend the same number of replicas for both. CPU-based scaling provides a more accurate representation of available resources.

---

## Minimum Replica Count

The CPA always supports a minimum number of replicas:

```yaml
min: 2
```

If the calculation produces 1 replica, the minimum floor raises it to 2. This guarantees that essential infrastructure services remain available even in very small clusters.

---

## Maximum Replica Count

A maximum can also be configured:

```yaml
max: 10
```

If the linear calculation returns 15 replicas, the CPA limits the Deployment to 10. This prevents excessive scaling in very large clusters.

---

## Scaling Timeline

Scaling rule: 1 replica per 4 nodes (`nodesPerReplica: 4`).

| Nodes | Calculation | Replicas |
|---|---|---|
| 2 | ceil(2 / 4) | 1 |
| 4 | ceil(4 / 4) | 1 |
| 8 | ceil(8 / 4) | 2 |
| 16 | ceil(16 / 4) | 4 |
| 32 | ceil(32 / 4) | 8 |

Replica count grows proportionally with cluster size.

---

## Benefits of Linear Scaling

**Predictable** — Replica counts can be calculated manually. Operations teams know exactly how infrastructure services will scale.

**Smooth growth** — Infrastructure capacity increases gradually, avoiding large sudden jumps.

**Easy to configure** — Only a few parameters are required. No complex formulas or monitoring systems are needed.

**Ideal for infrastructure services** — Services such as CoreDNS typically experience approximately linear growth as clusters expand.

---

## Limitations

Linear scaling assumes that workload demand increases proportionally with cluster size. This assumption is not always true:

- A 100-node cluster with very few running Pods may have low infrastructure demand despite its size
- A 20-node cluster with thousands of densely-packed Pods may have higher demand than the formula predicts

The Linear algorithm intentionally favors simplicity over workload awareness.

---

## Configuration Example

```yaml
linear:
  nodesPerReplica: 4
  min: 2
  max: 10
```

This configuration expresses:
- One replica for every four Worker Nodes
- Never fewer than two replicas
- Never more than ten replicas

To scale by CPU cores instead, use `coresPerReplica`:

```yaml
linear:
  coresPerReplica: 16
  min: 2
  max: 10
```

---

## When to Use Linear Scaling

Linear scaling works well when:
- Infrastructure demand grows gradually with cluster size
- Cluster expansion is predictable
- Workloads are evenly distributed across nodes
- Operational simplicity is preferred

Typical examples: CoreDNS, metrics collectors, internal monitoring agents, admission controllers.

---

## Best Practices

> [!tip]
> Start with conservative scaling factors and adjust them using production observations.

> [!tip]
> Always configure sensible minimum replica counts for critical infrastructure services.

> [!tip]
> If Worker Nodes have very different hardware specifications, consider scaling by CPU cores (`coresPerReplica`) instead of node count.

> [!warning]
> Linear scaling assumes proportional workload growth. Monitor infrastructure services to verify that this assumption remains valid for your cluster.

> [!note]
> The Linear algorithm is deterministic — the same cluster size always produces the same replica count.

---

## Key Takeaways

- The Linear algorithm scales workloads proportionally with cluster size using `ceil(size / factor)`
- Scaling can be based on Worker Nodes (`nodesPerReplica`) or total CPU cores (`coresPerReplica`)
- `min` and `max` bounds prevent unrealistic scaling in very small or very large clusters
- Linear scaling is predictable, simple, and well suited to infrastructure services
- It is the most commonly used scaling strategy for the Cluster Proportional Autoscaler
