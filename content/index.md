---
title: Kubernetes Autoscaling Notes
description: "Study notes on Kubernetes autoscaling mechanisms — HPA, VPA, CPA, and Pod Priority."
---

> [!abstract] Kubernetes Autoscaling
> Personal study notes covering Kubernetes autoscaling patterns and tools. Use the sidebar to navigate between sections or start with the overview below.

---

## Notes Structure

> [!tip] How to use these notes
> Each section covers a different autoscaling mechanism, from native Kubernetes components to cluster-level scaling and scheduling priorities.

| Section | Topics |
|---|---|
| [[01 - Foundations]] | Kubernetes basics, resource requests & limits, scaling overview |
| [[02 - Horizontal Pod Autoscaler]] | HPA v2, metrics sources, scaling policies, stabilization windows, troubleshooting |
| [[03 - Vertical Pod Autoscaler]] | VPA components, update modes, CRD, limitations, best practices |
| [[04 - Cluster Proportional Autoscaler]] | CPA architecture, linear and ladder algorithms, configuration |
| [[05 - Pod Priority and Preemption]] | PriorityClass, preemption process, scheduling policies |
