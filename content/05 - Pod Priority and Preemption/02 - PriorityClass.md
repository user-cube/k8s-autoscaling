---
title: 02 - PriorityClass
description: Learn how Kubernetes uses PriorityClass resources to assign priorities to Pods and influence scheduling decisions.
---

# 02 - PriorityClass

Although Pods have a priority value, Kubernetes does not expect users to assign numeric priorities directly. Instead, priorities are defined through a Kubernetes resource called **PriorityClass** — which maps a human-readable name to a numeric priority value. Pods reference the PriorityClass by name, allowing administrators to define consistent scheduling policies across the cluster.

---

## Why Use PriorityClass?

Configuring raw numeric priorities directly inside every Deployment quickly becomes unmanageable:

- What does `100000` represent?
- Is `50000` higher or lower than `75000`?
- Which values are reserved for infrastructure services?

PriorityClass replaces raw numbers with meaningful names.

---

## Creating a PriorityClass

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: critical-services
value: 100000
globalDefault: false
description: "Critical production services that must not be preempted by batch workloads."
```

Once created, every Pod referencing `critical-services` receives a priority of **100,000**.

> [!note]
> Priority values must be less than 1,000,000,000. Values ≥ 1,000,000,000 are reserved by Kubernetes for built-in system components.

---

## Key Fields

**`value`** — The numeric priority. Higher values represent higher priority.

**`globalDefault`** — If `true`, this PriorityClass is assigned to any Pod that does not specify a `priorityClassName`. Only one PriorityClass may have `globalDefault: true` in the cluster.

**`description`** — Human-readable explanation of the class's intended use. Optional but recommended in production.

---

## Using a PriorityClass

Reference the PriorityClass by name in the Pod spec:

```yaml
spec:
  priorityClassName: critical-services
```

When the Pod is created, Kubernetes automatically assigns the corresponding numeric priority. The raw number never appears in the Pod specification.

---

## Example

Cluster with the following PriorityClasses:

| Name | Priority |
|---|---:|
| batch | 1,000 |
| standard | 10,000 |
| production | 50,000 |
| critical-services | 100,000 |

A Deployment configured with `priorityClassName: production` automatically receives priority **50,000**.

---

## Built-In PriorityClasses

Many Kubernetes distributions include predefined PriorityClasses for system components:

- `system-cluster-critical` — Used by cluster-level infrastructure (CoreDNS, kube-proxy, networking components)
- `system-node-critical` — Used by node-level agents (kubelet, node problem detector)

> [!warning]
> User applications should never use `system-cluster-critical` or `system-node-critical`. These classes are reserved exclusively for Kubernetes system components.

---

## Scheduling Order

With three Pods pending:

```
Pod C (priority 100,000)  →  scheduled first
Pod B (priority  50,000)  →  scheduled second
Pod A (priority   1,000)  →  scheduled last
```

Higher priority always wins, regardless of queue arrival order.

---

## Relationship with Preemption

PriorityClasses influence both scheduling and preemption. When a high-priority Pod cannot be scheduled, the Scheduler searches for lower-priority Pods as preemption candidates. Without PriorityClasses, Kubernetes would have no way to distinguish workload importance.

---

## Recommended Priority Tiers

A common production strategy is to define a small number of well-known tiers:

| PriorityClass | Priority | Purpose |
|---|---:|---|
| batch | 1,000 | Background processing |
| standard | 10,000 | Default business applications |
| production | 50,000 | Customer-facing services |
| critical | 100,000 | Platform and business-critical workloads |

Keeping the number of classes small makes scheduling policies easier to understand and maintain.

---

## Common Mistakes

**Too many priority levels** — Creating dozens of PriorityClasses leads to confusion. In practice, only a few well-defined levels are required.

**Everything is critical** — If every workload receives the highest priority, priority loses its meaning. Reserve the highest classes for genuinely important workloads.

**Using system priorities** — Never assign `system-node-critical` or `system-cluster-critical` to application workloads.

---

## Best Practices

> [!tip]
> Use descriptive PriorityClass names rather than relying on numeric values.

> [!tip]
> Define only a small number of priority levels for the entire organization.

> [!tip]
> Reserve the highest priorities for critical infrastructure and business services.

> [!warning]
> Assigning excessively high priorities to ordinary workloads may prevent genuinely critical applications from being scheduled when resources become constrained.

> [!note]
> PriorityClass defines **how important** a workload is — it does not reserve CPU or memory resources.

---

## Key Takeaways

- PriorityClass maps human-readable names to numeric priority values
- Pods reference a PriorityClass using `priorityClassName` in the Pod spec
- Higher priority values receive scheduling preference
- PriorityClasses also determine which Pods may become preemption candidates
- Priority values must be below 1,000,000,000 — higher values are reserved for Kubernetes system use
- A small, well-defined set of PriorityClasses simplifies cluster operations
- System PriorityClasses (`system-cluster-critical`, `system-node-critical`) must be reserved for Kubernetes infrastructure components
