---
title: 01 - CPA Overview
description: Learn how the Cluster Proportional Autoscaler automatically adjusts supporting workloads according to the size of a Kubernetes cluster.
---

# 01 - Cluster Proportional Autoscaler (CPA)

The **Cluster Proportional Autoscaler (CPA)** is a specialized Kubernetes autoscaler that adjusts the number of replicas for a workload based on the **size of the Kubernetes cluster itself**.

Unlike the Horizontal Pod Autoscaler (HPA), which scales applications according to workload metrics, the CPA scales workloads according to cluster capacity. Its primary purpose is to ensure that infrastructure services grow and shrink alongside the Kubernetes cluster.

---

## Why Does Kubernetes Need a CPA?

Some services must scale according to the number of Worker Nodes rather than application traffic. Consider **CoreDNS** — every Pod in the cluster performs DNS lookups. As the cluster grows:

```
More Nodes → More Pods → More DNS Requests
```

Even if application traffic remains unchanged, the DNS workload increases. Scaling CoreDNS based on CPU utilization alone may not accurately reflect this growing demand. The CPA solves this by scaling CoreDNS according to cluster size.

---

## What Does the CPA Scale?

Unlike the HPA, the CPA is not intended for user applications. It commonly manages **cluster infrastructure services**:

- CoreDNS
- DNS caches
- Metrics collectors
- Admission webhooks
- Internal monitoring components
- Cluster-level controllers

These services become busier as the cluster itself expands.

---

## HPA vs CPA

Although both controllers change the number of replicas, they use completely different inputs:

| Horizontal Pod Autoscaler | Cluster Proportional Autoscaler |
|---|---|
| Scales based on metrics | Scales based on cluster size |
| CPU, Memory, Custom Metrics | Number of Nodes or CPU Cores |
| Optimizes application capacity | Optimizes infrastructure services |

The HPA answers: **Is the application under load?**

The CPA answers: **Has the cluster grown?**

---

## High-Level Architecture

The CPA continuously observes the Kubernetes cluster and updates Deployments directly — no Metrics Server or Prometheus required:

```mermaid
flowchart LR

Cluster["Kubernetes Cluster"] --> CPA["Cluster Proportional Autoscaler"] --> Deployment --> Pods
```

Instead of collecting application metrics, the CPA periodically inspects cluster resources: number of Worker Nodes, total CPU cores, or total cluster capacity.

---

## How the CPA Works

```mermaid
flowchart LR

A[Read Cluster Size] --> B[Apply Scaling Formula] --> C[Calculate Replicas] --> D[Update Deployment]
```

The CPA bases its decisions entirely on cluster characteristics — no Metrics Server, Prometheus, or Metrics Adapter is involved.

---

## Example

Cluster with 3 Worker Nodes, CPA configured with 1 DNS Pod per 2 Worker Nodes:

```
3 Nodes  →  2 CoreDNS Pods
```

Cluster expands to 10 Worker Nodes:

```
10 Nodes  →  5 CoreDNS Pods
```

No application traffic was involved in this decision — only cluster size changed.

---

## Typical Use Cases

| Service | Why Scale? |
|---|---|
| CoreDNS | More Pods generate more DNS queries |
| DNS Cache | Increased DNS traffic |
| Metrics Collector | More Nodes produce more metrics |
| Admission Controller | More workloads require admission requests |
| Logging Agents | Larger clusters generate more logs |

---

## Why Not Use the HPA?

CPU usage may remain relatively stable while the cluster continues growing:

```
CPU: 35%   |   Nodes: 4 → 40
```

The workload has clearly increased, even though CPU utilization has not yet reached a scaling threshold. The CPA provides a much more predictable scaling strategy for infrastructure services.

---

## Key Characteristics

- Scales infrastructure workloads based on cluster size
- Does not require Metrics Server, Prometheus, or custom metrics
- Updates Deployments directly — same mechanism as the HPA
- Considerably simpler than HPA or VPA

---

## Key Takeaways

- The CPA scales workloads according to cluster size rather than application demand
- It is primarily intended for infrastructure services such as CoreDNS
- Scaling decisions are based on cluster capacity instead of CPU or memory utilization
- No Metrics Server or metrics pipeline is required
- The CPA complements the HPA rather than replacing it
