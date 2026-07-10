---
title: 04 - Pod Priority Best Practices
description: Production recommendations for designing effective PriorityClass hierarchies and using preemption safely in Kubernetes clusters.
---

# 04 - Pod Priority Best Practices

Pod Priority is a powerful scheduling mechanism, but it should be used carefully. Assigning priorities without a clear strategy can make cluster behavior unpredictable and may even prevent critical workloads from running when resources become constrained.

The goal of Pod Priority is **not** to make every workload important — its purpose is to ensure that the **most critical workloads receive resources first** during periods of resource contention.

---

## Design a Small Priority Hierarchy

One of the most common mistakes is creating dozens of PriorityClasses. Over time, it becomes almost impossible to understand the difference between `critical-a`, `critical-b`, and `critical-c`. Instead, define a small number of well-known priority levels:

| PriorityClass | Purpose |
|---|---|
| batch | Background jobs |
| standard | Business applications |
| production | Customer-facing services |
| critical | Platform and mission-critical workloads |

A simple hierarchy is easier to maintain and easier for development teams to understand.

---

## Reserve High Priorities

Not every application is business-critical. If every Deployment uses `priorityClassName: critical`, priorities lose their purpose — Kubernetes has no reason to prefer one workload over another. Reserve the highest priorities for services whose unavailability would have the greatest operational or business impact.

---

## Protect Infrastructure Components

Certain workloads are fundamental to cluster operation: CoreDNS, ingress controllers, monitoring agents, authentication services, service mesh components. These should generally receive higher priorities than ordinary application Pods. Without them, the cluster may become unstable even if application Pods continue running.

---

## Avoid Using Reserved System Classes

Never assign `system-cluster-critical` or `system-node-critical` to user applications. These classes are reserved for Kubernetes system components. Using them for applications may interfere with Kubernetes' ability to protect its own control-plane services during resource shortages.

---

## Combine Priority with Pod Disruption Budgets

Priority determines **which Pods may be preempted**. Pod Disruption Budgets make those Pods **less likely to be selected**: the Scheduler prefers victims whose PDBs would not be violated. Note that this is **best-effort** — if no other victims can free enough resources, preemption proceeds even when it violates a PDB. Priority and availability policies should still be designed together, but a PDB alone is not a guarantee against preemption.

---

## Use Multiple Replicas

High-priority workloads should rarely run with a single replica. Multiple replicas improve both availability and scheduling flexibility — if one replica is preempted, others continue serving traffic.

---

## Monitor Preemption Events

Preemption should be an exceptional event. If Pods are being preempted regularly, the underlying problem is usually insufficient cluster capacity, incorrect resource requests, or overly aggressive priority assignments — not an incorrect priority hierarchy.

```bash
kubectl get events --field-selector reason=Preempted
kubectl describe pod <pod-name>
```

Frequent preemption is a signal that the Cluster Autoscaler or capacity planning requires attention.

---

## Plan for Cluster Growth

Priority is **not** a replacement for additional infrastructure. If critical services continuously preempt lower-priority workloads, background jobs may never execute. If this situation persists, the cluster requires more capacity rather than more aggressive priority rules. Priority should complement — not replace — the Cluster Autoscaler.

---

## Keep Resource Requests Accurate

The Scheduler uses **resource requests**, not actual usage, when making scheduling decisions. A Pod requesting 4 CPU cores but consistently using `400m` causes the Scheduler to unnecessarily reserve 4 cores, reducing scheduling efficiency and potentially triggering unnecessary preemption. Accurate requests improve the effectiveness of both scheduling and autoscaling.

---

## Test Under Resource Pressure

Priority behavior should be validated before production incidents occur:

1. Deploy low-priority workloads
2. Fill the cluster to capacity
3. Deploy a high-priority application
4. Observe scheduling decisions
5. Verify that preemption behaves as expected

Controlled testing provides confidence that priorities have been configured correctly.

---

## Common Production Strategy

```
Critical Infrastructure      (highest)
Customer-Facing Services
Internal Business Services
Background Processing
Batch Jobs                   (lowest)
```

This simple model aligns well with most operational requirements.

---

## Production Checklist

Before using Pod Priority in production, verify:

- [ ] PriorityClasses have meaningful, descriptive names
- [ ] Only a small number of priority levels exist
- [ ] Critical workloads have multiple replicas
- [ ] Pod Disruption Budgets are configured
- [ ] Resource requests are realistic and reflect actual usage
- [ ] Monitoring captures preemption events
- [ ] Cluster capacity is regularly reviewed
- [ ] Reserved system PriorityClasses are not used by application workloads

---

## Best Practices Summary

| Recommendation | Reason |
|---|---|
| Keep the priority hierarchy small | Simplifies scheduling policies |
| Reserve the highest priorities | Protect genuinely critical workloads |
| Use multiple replicas | Improve availability |
| Configure Pod Disruption Budgets | Prevent excessive disruption |
| Monitor preemption events | Detect capacity issues early |
| Keep resource requests accurate | Improve scheduling efficiency |
| Validate priorities through testing | Confirm expected scheduling behavior |

---

## Key Takeaways

- Pod Priority should reflect genuine business and operational importance
- A small number of PriorityClasses is easier to understand and maintain
- High-priority workloads should also be highly available
- Frequent preemption usually indicates a capacity planning issue rather than a scheduling issue
- Pod Priority, Pod Disruption Budgets, and the Cluster Autoscaler work together to provide resilient scheduling behavior
- Effective priority management improves cluster reliability without increasing operational complexity
