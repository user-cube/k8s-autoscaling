---
title: 07 - Expander Strategies
description: Learn how the Cluster Autoscaler chooses between multiple Node Groups using Expander Strategies.
---

# 07 - Expander Strategies

In simple Kubernetes clusters, there is usually only a single Node Group. When additional capacity is required, the Cluster Autoscaler simply increases the size of that group.

Production clusters often contain **multiple Node Groups** capable of running the same workload, which introduces an important question:

> **Which Node Group should be expanded?**

The answer depends on the configured **Expander Strategy** — the algorithm the Cluster Autoscaler uses to select the most appropriate Node Group when multiple valid options exist.

---

## Why Are Expanders Needed?

Consider a cluster with three Node Groups (4 vCPU General, 16 vCPU Large, 4 vCPU Spot). A Pending Pod requires 2 vCPU — all three groups are compatible. Without an Expander Strategy, the decision would be arbitrary.

---

## High-Level Decision Process

```mermaid
flowchart LR

A[Pending Pod] --> B[Find Compatible Node Groups] --> C[Apply Expander Strategy] --> D[Select Node Group] --> E[Provision Worker Node]
```

The Expander is responsible only for selecting the Node Group. Infrastructure provisioning remains unchanged.

---

## Available Strategies

| Strategy | Selection Criteria |
|---|---|
| Random | Random compatible Node Group |
| Least Waste | Minimize unused resources |
| Most Pods | Schedule the most currently Pending Pods |
| Priority | Use administrator-defined priorities |
| Price | Cheapest option (GKE/GCE only) |

> [!note]
> The default Cluster Autoscaler expander is `random`. For most production environments, explicitly configuring `least-waste` or `priority` is recommended. Recent versions also support chaining expanders as tie-breakers, e.g. `--expander=priority,least-waste`.

---

## Random Strategy

When multiple Node Groups satisfy the scheduling requirements, one is selected randomly. Although simple to implement, this strategy produces unpredictable infrastructure allocation and is rarely used in production.

---

## Least Waste Strategy

Minimizes unused CPU and memory after scheduling the Pending Pods. Given two Node Groups where the Pending Pod needs 3 CPU:

| Node Group | Total CPU | Remaining After |
|---|---:|---:|
| Small (4 CPU) | 4 | 1 CPU free |
| Large (16 CPU) | 16 | 13 CPU free |

The Cluster Autoscaler selects **Small** — it leaves less unused capacity, improving cluster utilization and reducing infrastructure waste.

---

## Most Pods Strategy

Chooses the Node Group that would be able to schedule the **largest number of currently Pending Pods** in this scale-up. It is useful during bursts, when many Pods are pending at once and some node groups can absorb more of them than others (for example, because of `nodeSelector` constraints).

> [!note]
> `most-pods` does **not** prefer bigger nodes over smaller ones — the Cluster Autoscaler can add multiple smaller nodes at once. With a single Pending Pod, every compatible Node Group ties (each schedules exactly one Pod).

---

## Priority Strategy

Allows administrators to define preferred Node Groups with explicit priorities:

```
Priority 100  →  Spot Nodes
Priority  50  →  General Purpose
Priority  10  →  GPU
```

Whenever multiple Node Groups satisfy scheduling requirements, Kubernetes chooses the highest-priority one. Particularly useful for Spot-first cost optimization.

The priorities are defined in a ConfigMap named `cluster-autoscaler-priority-expander`, mapping priority values to regular expressions matched against node group names.

---

## Cost Optimization Example

An organization prefers Spot Instances whenever possible. Priority configuration: Spot at 100, On-Demand at 50. A standard Web API Pod arrives — both groups are compatible. The Cluster Autoscaler provisions a Spot Instance. Only if Spot capacity is unavailable does Kubernetes fall back to On-Demand.

---

## Comparing the Strategies

| Strategy | Main Objective | Recommended For |
|---|---|---|
| Random | Simple selection | Testing only |
| Least Waste | Maximize resource utilization | Most production clusters |
| Most Pods | Absorb the most Pending Pods per scale-up | High-burst environments with many simultaneous Pending Pods |
| Priority | Follow administrator preferences | Multi-tier or Spot/On-Demand setups |

---

## Decision Example

Node Groups: General (8 CPU), Spot (8 CPU), GPU (16 CPU). Pending: standard Web API needing 8 CPU.

| Strategy | Selected Node Group |
|---|---|
| Random | Any compatible group |
| Least Waste | General or Spot (equal waste — GPU would leave 8 CPU idle) |
| Most Pods | Tie — every group schedules the single Pending Pod |
| Priority | Depends on configured priorities |

The same scheduling request produces different infrastructure decisions depending on the selected Expander.

---

## Best Practices

> [!tip]
> Use **Least Waste** for most production clusters — it provides the best balance between resource utilization and infrastructure cost.

> [!tip]
> Use **Priority** when different Node Groups have different operational costs, such as Spot and On-Demand instances.

> [!tip]
> Review Expander behavior whenever new Node Groups are introduced into the cluster.

> [!warning]
> An inappropriate Expander Strategy may increase infrastructure costs or lead to inefficient resource utilization.

> [!note]
> Expander Strategies influence **which Node Group grows**. They do not affect how the Cluster Autoscaler performs scale-up or scale-down operations.

---

## Key Takeaways

- Expander Strategies determine which Node Group is expanded when multiple compatible options exist
- The default expander is `random` — explicitly configure one for production use
- Least Waste minimizes unused CPU and memory and is recommended for most production clusters
- Most Pods favors the group that schedules the most currently Pending Pods — it does not prefer bigger nodes
- Priority allows administrators to express infrastructure preferences such as Spot-first deployments
- Choosing the appropriate Expander Strategy improves both resource utilization and infrastructure cost efficiency
