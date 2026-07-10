---
title: 05 - Resource Metrics
description: Understand how the Horizontal Pod Autoscaler uses CPU and memory metrics to make scaling decisions.
---

# 05 - Resource Metrics

Resource metrics are the simplest and most commonly used metrics for the HPA. Instead of relying on application-specific information, Kubernetes uses the consumption of fundamental system resources — primarily **CPU** and **memory** — to determine whether a workload should scale.

Because these metrics are available in every Kubernetes cluster with a running Metrics Server, they are usually the first choice when implementing autoscaling.

---

## What Are Resource Metrics?

Resource metrics describe how much CPU or memory a workload is currently consuming. The HPA continuously compares observed utilization against a predefined target:

```yaml
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

This tells Kubernetes to maintain an average CPU utilization of approximately **70%** across all Pods. When average utilization exceeds the threshold the HPA increases replicas; when it falls below, it may reduce them.

---

## CPU Metrics

CPU is by far the most common metric used for autoscaling. Unlike memory, CPU usage generally reflects the amount of work an application is performing at any given moment — REST APIs, web servers, stateless microservices, and backend services all tend to consume more CPU as request volume increases.

### CPU Requests

The HPA does **not** use the node's CPU utilization. It calculates utilization relative to each container's **CPU request**:

```yaml
resources:
  requests:
    cpu: 500m
```

If the container currently consumes `250m`:

```
250m / 500m = 50%
```

This percentage — not the absolute CPU usage — is what the HPA evaluates.

> [!important]
> If a container does not define a CPU request, the HPA cannot calculate CPU utilization correctly.

---

## Memory Metrics

Memory metrics are configured in the same way:

```yaml
metrics:
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 75
```

### CPU vs Memory

Although both are supported, they behave very differently.

**CPU** is dynamic — when workload increases, CPU usage usually rises immediately.

**Memory** often does not correlate with workload. Applications frequently allocate memory once and retain it for their lifetime:

```
Application starts → Allocates 2 GiB
→ Handles 100 requests   → Memory: ~2 GiB
→ Handles 10,000 requests → Memory: ~2 GiB
```

Scaling based solely on memory would not accurately reflect this application's demand.

---

## Average Utilization

The HPA evaluates the **average utilization across all replicas**, not individual Pods:

| Pod | CPU |
|---|---|
| Pod A | 80% |
| Pod B | 75% |
| Pod C | 55% |

```
(80 + 75 + 55) / 3 = 70%
```

If the configured target is 70%, no scaling occurs — even though one Pod is heavily loaded, the workload as a whole is within the desired threshold.

---

## Resource Requests vs Limits

The HPA uses **resource requests** to calculate utilization — not limits.

```yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2
    memory: 2Gi
```

If the container consumes `250m` CPU:

```
250 / 500 = 50%
```

The CPU limit of 2 cores is irrelevant to this calculation.

### Why Requests Matter

Without a CPU request, Kubernetes has no baseline to measure utilization against:

```yaml
# Missing requests — only limits defined
resources:
  limits:
    cpu: 1
```

The Metrics Server can still report raw CPU usage, but the HPA cannot compute a utilization percentage. This is one of the most common configuration mistakes in production clusters.

---

## Full Example

```yaml
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

Current state:

| Pod | CPU |
|---|---|
| frontend-1 | 81% |
| frontend-2 | 77% |
| frontend-3 | 84% |
| **Average** | **80%** |

80% > 70% target → HPA calculates a new desired replica count, updates the Deployment, and once additional Pods become ready, traffic distributes across more instances, reducing average CPU utilization.

---

## When to Use Resource Metrics

**Good fit:**
- CPU usage closely reflects workload demand
- Application is stateless and Pods can start quickly
- Additional replicas improve throughput

Examples: NGINX, Apache, Spring Boot APIs, ASP.NET Core, Node.js, Go microservices.

**Poor fit:**
- CPU remains low despite increasing queue length
- Memory usage is constant regardless of workload
- Application spends most of its time waiting for I/O
- Scaling depends on business events rather than infrastructure metrics

Examples: Kafka consumers, RabbitMQ workers, batch jobs, event-driven architectures. These benefit more from **Custom Metrics** or **External Metrics**.

---

## Best Practices

> [!tip]
> Always define CPU and memory **requests** for every container — utilization cannot be calculated without them.

> [!tip]
> CPU utilization is generally a more reliable scaling metric than memory utilization.

> [!warning]
> Do not assume that high memory usage necessarily indicates increased workload.

> [!note]
> Resource metrics are ideal for stateless applications but may be insufficient for event-driven systems.

---

## Key Takeaways

- Resource metrics are the simplest metrics supported by the HPA
- CPU and memory are collected by the Metrics Server from each kubelet
- CPU utilization is calculated relative to **resource requests**, not limits
- The HPA evaluates average utilization across all replicas, not individual Pods
- CPU is generally a more reliable scaling metric than memory
- Missing resource requests is one of the most common HPA configuration mistakes
