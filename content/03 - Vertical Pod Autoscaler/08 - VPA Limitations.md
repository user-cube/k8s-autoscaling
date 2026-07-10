---
title: 08 - VPA Limitations
description: Understand the limitations of the Vertical Pod Autoscaler and learn when it is not the appropriate autoscaling solution.
---

# 08 - VPA Limitations

Although the Vertical Pod Autoscaler (VPA) is an extremely powerful tool for optimizing CPU and memory allocation, it is **not** suitable for every workload.

Like any Kubernetes component, the VPA makes design trade-offs. Understanding these limitations is essential when deciding whether to use the VPA, the HPA, or a combination of both.

---

## Pod Recreation Is Usually Required

The most important limitation of the VPA is that applying new resource requests typically requires the affected Pod to be recreated.

```
Current CPU Request: 500m  →  Recommended: 1000m
```

The VPA cannot simply resize a running Pod. Instead:

```
Running Pod → Eviction → Replacement Pod → Updated Resources
```

For applications that cannot tolerate restarts, this may be unacceptable.

> [!note]
> In-place Pod resource updates (`InPlacePodVerticalScaling`) entered alpha in Kubernetes 1.27 and beta (enabled by default) in Kubernetes 1.33. VPA 1.4+ exposes this through the `InPlaceOrRecreate` update mode, reducing the need for Pod recreation.

---

## Short Service Interruptions

For stateless applications running multiple replicas, Pod replacement is usually transparent:

```
Service
  ↓
Pod A removed
  ↓
Pod B and C continue serving traffic
  ↓
Replacement Pod becomes Ready
```

For single-replica workloads, however, recreation may briefly interrupt the application. This is why production workloads should generally avoid running a single replica when automatic VPA updates are enabled.

---

## Long Startup Times

Applications with slow startup times benefit less from automatic updates. Each resource adjustment introduces a recovery period before the replacement Pod becomes fully operational.

Examples:
- Large Java applications
- Machine learning models
- Legacy enterprise software

For these workloads, **Initial** or **Off** mode may be preferable.

---

## Stateful Applications

Stateful applications require special attention. Although Kubernetes can recreate these Pods, the application itself may require leader election, replication, recovery, or data synchronization before becoming operational again.

Examples: PostgreSQL, MySQL, MongoDB, Kafka brokers, Elasticsearch.

Automatic updates may introduce unnecessary operational complexity. Many organizations operate the VPA in **recommendation mode** for stateful systems.

---

## HPA and VPA Interaction

> Can the Horizontal Pod Autoscaler and Vertical Pod Autoscaler be used together?

**Yes — but carefully.** Consider this scenario:

The HPA scales using CPU utilization. The VPA simultaneously increases CPU requests:

```
Higher CPU Requests → Lower CPU Utilization → HPA decides fewer Pods are needed
```

The two controllers begin influencing each other's decisions. This feedback loop can produce unstable scaling behavior.

### Recommended Combination

Modern Kubernetes environments commonly combine:

```
HPA  →  Replica Count
VPA  →  Memory Requests
```

This avoids conflicts while still allowing both controllers to optimize different aspects of the workload.

---

## Historical Learning Required

Unlike the HPA, which reacts almost immediately to workload changes, the VPA requires historical observations. Immediately after deployment, very little data is available and recommendations are limited. The VPA becomes progressively more useful over time as more observations are collected.

---

## Not a Performance Tuning Tool

Increasing CPU and memory does not automatically improve application performance. If an API spends most of its time waiting for a database, doubling CPU allocation may have almost no measurable effect — the actual bottleneck lies elsewhere.

Before relying on the VPA, always identify the true performance constraints of the application.

---

## Scheduler Constraints

Increasing resource requests may make Pods more difficult to schedule. If the VPA recommends 4 CPUs but no Worker Node has sufficient available CPU, the replacement Pod remains `Pending`.

The VPA has successfully applied its recommendation, but the cluster lacks sufficient capacity. This is why VPA often works best alongside a properly configured Cluster Autoscaler.

---

## Frequent Recommendation Changes

Applications with highly variable workloads may produce continuously changing recommendations:

```
Morning: 600m  →  Afternoon: 1200m  →  Night: 450m
```

If automatic updates are enabled, excessive Pod recreation may occur. Carefully selecting the appropriate update mode helps reduce unnecessary workload disruptions.

---

## Cost Considerations

The VPA improves resource efficiency, but it does not always reduce costs. If an application was previously under-provisioned, the VPA may increase CPU or memory recommendations — raising infrastructure cost while improving stability.

Resource optimization should therefore be viewed as balancing performance, reliability, and infrastructure utilization — not simply minimizing cloud expenses.

---

## Summary

The VPA works best for workloads that:
- Tolerate Pod recreation
- Have stable resource consumption
- Benefit from improved CPU and memory sizing

Other workloads may be better served by the HPA, manual tuning, or application-specific scaling strategies.

---

## Best Practices

> [!tip]
> Begin with **Off** mode and evaluate recommendations before enabling automatic updates.

> [!tip]
> Use Pod Disruption Budgets to minimize the impact of Pod replacement.

> [!tip]
> Ensure applications can recover quickly after Pod recreation.

> [!warning]
> Avoid using the VPA to solve application bottlenecks unrelated to CPU or memory allocation.

> [!note]
> The VPA optimizes resource allocation — it does not improve application architecture or eliminate performance bottlenecks.

---

## Key Takeaways

- The VPA generally requires Pod recreation to apply new resource requests
- Applications with long startup times or strict availability requirements require careful planning
- Stateful workloads often use recommendation-only mode
- Combining HPA and VPA requires careful metric selection to avoid feedback loops
- Larger resource requests may introduce scheduling challenges
- The VPA should be viewed as a resource optimization tool rather than a universal performance solution
