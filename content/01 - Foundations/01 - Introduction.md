---
title: 01 - Introduction
description: Why Kubernetes autoscaling matters and an overview of the scaling mechanisms available.
---

# 01 - Introduction to Kubernetes Autoscaling

Modern applications rarely experience constant traffic. Workloads fluctuate throughout the day due to user activity, scheduled jobs, seasonal events, and unexpected traffic spikes.

Provisioning infrastructure for the maximum expected load ensures reliability but often leads to wasted resources and unnecessary costs. Provisioning only for average traffic may result in poor performance or service outages during peak demand.

Kubernetes addresses this challenge through **autoscaling** — a collection of mechanisms that continuously monitor the state of applications and automatically adjust computing resources according to demand, without requiring constant manual intervention from operators.

---

## Why Autoscaling Matters

**Cost Optimization** — Applications consume only the resources they actually require. When traffic decreases, unnecessary Pods or Nodes can be removed, reducing infrastructure costs.

**High Availability** — During periods of increased demand, additional replicas are automatically created, helping applications continue serving requests without becoming overloaded.

**Better Resource Utilization** — CPU and memory are allocated dynamically rather than remaining permanently reserved.

**Elasticity** — Cloud-native applications should be able to rapidly expand and contract according to workload without affecting users.

**Fault Tolerance** — If demand suddenly increases or part of the infrastructure becomes unavailable, Kubernetes can automatically compensate by creating additional replicas or expanding cluster capacity.

**Operational Simplicity** — Kubernetes automates repetitive operational tasks, allowing engineers to focus on application development instead of infrastructure management.

---

## Scaling Categories

Kubernetes supports two major categories of scaling:

- **Cluster Scaling** — adjusts the number of worker nodes
- **Pod Scaling** — adjusts application workloads

### Cluster Scaling

Managed by the **Cluster Autoscaler**, cluster scaling focuses on the Kubernetes infrastructure itself:

- Increase cluster capacity when Pods cannot be scheduled
- Remove unused nodes to reduce cost
- Provide resources for new Pods

> Cluster scaling changes the size of the cluster — not the applications running inside it.

### Pod Scaling

| Component | Mechanism | Typical Use Case |
|---|---|---|
| **HPA** (Horizontal Pod Autoscaler) | Increases or decreases the number of Pod replicas | Handle varying application traffic |
| **VPA** (Vertical Pod Autoscaler) | Adjusts CPU and memory requests/limits per Pod | Optimize resource allocation |
| **KEDA** | Scales workloads based on external events | Message queues, HTTP traffic, monitoring metrics |

---

## How They Work Together

1. HPA detects increased utilization
2. New Pods are created
3. The Scheduler attempts to place them
4. If resources are insufficient, Pods remain `Pending`
5. Cluster Autoscaler provisions additional nodes
6. Pending Pods are scheduled automatically

---

## Key Takeaways

- Autoscaling adapts infrastructure to demand without manual intervention
- Cluster Autoscaler manages nodes; HPA, VPA, and KEDA manage Pods
- The components are complementary — they are designed to work together
