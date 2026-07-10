---
title: Kubernetes Autoscaling Notes
description: "Study notes on Kubernetes autoscaling mechanisms — HPA, VPA, KEDA, and Cluster Autoscaler."
---

> [!abstract] Kubernetes Autoscaling
> Personal study notes covering Kubernetes autoscaling patterns and tools. Use the sidebar to navigate between sections or start with the overview below.

---

## Notes Structure

> [!tip] How to use these notes
> Each section covers a different autoscaling mechanism, from native Kubernetes components to event-driven and cluster-level scaling.

| Section | Topics |
|---|---|
| [[01 - Foundations]] | Kubernetes basics, resource requests & limits, metrics pipeline |
| [[02 - Horizontal Pod Autoscaler]] | HPA v2, metrics sources, cooldown, behaviour tuning |
| [[03 - Vertical Pod Autoscaler]] | VPA modes, update policy, LimitRange interaction |
| [[04 - KEDA]] | ScaledObjects, scalers, triggers, KEDA vs HPA |
| [[05 - Cluster Autoscaler]] | Node provisioning, scale-down, cloud provider integration |
| [[06 - Patterns & Best Practices]] | Combining scalers, pitfalls, production considerations |
