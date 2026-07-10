---
title: 08 - Cluster Autoscaler Limitations
description: Understand the limitations of the Cluster Autoscaler and the scenarios where automatic node scaling may not behave as expected.
---

# 08 - Cluster Autoscaler Limitations

The Cluster Autoscaler is highly effective at automatically adjusting cluster capacity, but it is **not a universal solution**. It can only provision or remove Worker Nodes under specific conditions. Understanding these limitations is essential for designing reliable Kubernetes platforms and avoiding unexpected scheduling behavior.

---

## Provisioning Takes Time

Unlike the HPA, which creates Pods almost immediately, the Cluster Autoscaler must provision an entirely new Worker Node:

```
Pending Pod → Provision VM → Boot OS → Start kubelet → Join Cluster → Schedule Pod
```

Depending on the cloud provider, this process typically takes **30 seconds to several minutes**. Applications must tolerate this startup delay.

---

## It Only Solves Capacity Problems

The Cluster Autoscaler responds only when additional infrastructure would solve the scheduling problem. If a Pod requires a GPU node but no GPU Node Group is configured, adding more general-purpose nodes does not help — no scale-up occurs. The Cluster Autoscaler cannot provision hardware that has not been configured.

---

## Resource Requests Must Be Accurate

Scheduling decisions are based on **resource requests**, not actual usage. A Pod requesting `cpu: 8` but consuming `500m` causes the Scheduler to reserve 8 CPU cores unnecessarily. Overestimated requests lead to:

- Inefficient scheduling
- Unnecessary infrastructure growth
- Increased operational costs

---

## Cloud Provider Limits

Infrastructure provisioning ultimately depends on the cloud provider. Virtual machine quotas, regional capacity shortages, API rate limits, or account restrictions can all cause scale-up to fail — even when the Cluster Autoscaler has correctly identified the need for a new node.

---

## Maximum Node Group Size

Every Node Group defines a maximum size. Once reached, no additional Worker Nodes can be created from that group. Pending Pods remain unscheduled until capacity becomes available elsewhere.

---

## Local Storage

Pods using local storage prevent scale-down — removing the Worker Node would also remove the locally stored data. Persistent Volumes (PVs) should generally be preferred over local storage for workloads expected to move between nodes.

---

## Pod Disruption Budgets

PDBs protect application availability. If evicting a Pod would violate a configured `minAvailable` or `maxUnavailable`, the Cluster Autoscaler postpones scale-down until relocation becomes possible. Availability always takes precedence over infrastructure optimization.

---

## DaemonSets

DaemonSets run one Pod on every Worker Node (log collectors, monitoring agents, networking components). Although they don't usually prevent scale-down directly, they contribute to node resource usage. Clusters with many DaemonSets experience lower packing efficiency and fewer opportunities for node removal.

---

## Scheduling Constraints

Complex scheduling rules can prevent successful scale-up. If a Pod requires a specific zone, affinity rule, or taint toleration and no compatible Node Group exists for it, adding nodes elsewhere does not solve the problem. Common constraints that can block scale-up:

- Node Affinity / Pod Affinity / Pod Anti-Affinity
- Taints and Tolerations
- Topology Spread Constraints

---

## Frequent Scaling

Highly dynamic workloads may repeatedly trigger scale-up and scale-down, resulting in infrastructure churn, increased cloud API activity, and repeated VM provisioning. Proper stabilization settings and realistic resource requests help reduce unnecessary scaling activity.

---

## Scale From Zero Delays

Scale From Zero reduces infrastructure costs but introduces startup latency — a Pod from a zero-node group must wait for a VM to be provisioned before it can start. Interactive or latency-sensitive applications may require warm capacity rather than relying on on-demand provisioning.

---

## Not a Replacement for Capacity Planning

The Cluster Autoscaler automates infrastructure management but does not eliminate the need for capacity planning: selecting appropriate VM sizes, designing Node Groups, estimating workload growth, and configuring cloud quotas still require human decisions. Poor infrastructure design cannot be solved by autoscaling alone.

---

## Alternative: Karpenter

Several of these limitations stem from the node-group model itself — fixed instance types, pre-defined groups, and group-level scaling. **Karpenter** (originally AWS, now a CNCF project) takes a different approach: it provisions individual nodes directly, choosing the instance type per Pending Pod from a flexible set of requirements, without static node groups. It typically provisions faster and packs more efficiently, at the cost of a different operational model. For AWS-based clusters, Karpenter is increasingly the default choice over the Cluster Autoscaler.

---

## Summary

The Cluster Autoscaler works well when:
- Workloads define realistic resource requests
- Node Groups are designed to match workload requirements
- Scheduling constraints are well understood
- Cloud infrastructure can expand as required

It is less effective when scheduling failures are caused by configuration errors rather than insufficient capacity.

---

## Best Practices

> [!tip]
> Define realistic CPU and memory requests. Accurate requests improve scheduling decisions and reduce unnecessary node provisioning.

> [!tip]
> Design Node Groups that match workload requirements, including GPU, memory-optimized, or Spot infrastructure.

> [!tip]
> Monitor cloud provider quotas and Node Group limits to avoid unexpected provisioning failures.

> [!warning]
> The Cluster Autoscaler cannot solve scheduling problems caused by incorrect affinity rules, missing Node Groups, or impossible scheduling constraints.

> [!note]
> The Cluster Autoscaler manages infrastructure capacity — not application configuration. Scheduling policies must still be designed carefully.

---

## Key Takeaways

- The Cluster Autoscaler provisions infrastructure only when additional nodes can resolve scheduling failures
- Infrastructure provisioning introduces unavoidable startup delays
- Resource requests strongly influence scaling behavior
- Cloud provider quotas and Node Group limits can prevent successful scale-up
- Pod Disruption Budgets and scheduling constraints may prevent scale-down
- Effective Cluster Autoscaler deployments depend on good cluster design as much as on the autoscaler itself
