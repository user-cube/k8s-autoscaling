---
title: 06 - VPA Update Modes
description: Learn how the Vertical Pod Autoscaler applies recommendations through its different operating modes and when each mode should be used.
---

# 06 - VPA Update Modes

Not every workload can tolerate automatic Pod replacement. A production database restarting to apply a memory recommendation may interrupt service. A stateless frontend Pod restarting has almost no visible impact.

VPA **Update Modes** allow administrators to choose how — and whether — recommendations should be applied, adapting to each workload's availability requirements.

---

## Available Modes

| Mode | Recommendations | Updates Running Pods | Updates New Pods |
|---|:---:|:---:|:---:|
| **Off** | ✅ | ❌ | ❌ |
| **Initial** | ✅ | ❌ | ✅ (creation only) |
| **Auto** | ✅ | ✅ | ✅ |
| **Recreate** | ✅ | ✅ | ✅ |

---

## Off Mode

```yaml
updatePolicy:
  updateMode: "Off"
```

The Recommender analyzes workloads and generates recommendations — but nothing is applied automatically. Operators review recommendations and update Deployments manually.

**Best for:** Production databases, critical applications, initial VPA evaluation, capacity planning.

Many organizations begin with `Off` to understand workload behavior before enabling automatic updates.

---

## Initial Mode

```yaml
updatePolicy:
  updateMode: "Initial"
```

Recommendations are applied **whenever a Pod is created** (via the Admission Controller) — including Pods recreated by normal rollouts and CI/CD deployments. What `Initial` never does is **evict running Pods**: if recommendations change later, existing Pods continue with their current requests until something else recreates them.

**Example:**
```
Pod created today:      CPU: 500m requested → VPA injects 800m
Recommendation changes to 1 CPU one week later → running Pod stays at 800m
```

**Best for:** Workloads recreated frequently through CI/CD pipelines, rolling deployments that already cause regular Pod replacement.

---

## Auto Mode

```yaml
updatePolicy:
  updateMode: "Auto"
```

The most commonly used mode. The VPA continuously generates recommendations, evaluates whether Pods are outdated, and replaces them when beneficial — respecting Pod Disruption Budgets and rolling update strategies.

```
Recommendation → Updater → Evict Pod → New Pod with updated resources
```

**Best for:** Stateless services, web applications, REST APIs, cloud-native microservices.

> [!note]
> In current VPA implementations, `Auto` and `Recreate` behave nearly identically — `Auto` is preferred as it integrates more intelligently with workload availability guarantees and is the direction for future improvements (e.g. in-place updates).

---

## Recreate Mode

```yaml
updatePolicy:
  updateMode: "Recreate"
```

Always recreates Pods when a recommendation should be applied — explicitly and predictably. This was the original VPA update mechanism before more sophisticated strategies were introduced.

**Best for:** Controlled environments, predictable maintenance windows, workloads where explicit Pod recreation is preferred over automatic management.

---

## Interaction with the Admission Controller

The update mode determines **when** the Admission Controller's injection is triggered:

| Mode | When recommendations are injected |
|---|---|
| Off | Never |
| Initial | At every Pod creation — but VPA never evicts running Pods |
| Auto | At every Pod creation — and the Updater actively evicts outdated Pods |
| Recreate | At every Pod creation — and VPA triggers Pod recreation |

The Admission Controller always performs the same task — the mode controls the trigger.

---

## Migration Strategy

A common adoption path:

```
Off → review recommendations → Initial → observe behavior → Auto
```

This gradual approach builds confidence before enabling fully automatic updates.

---

## Best Practices

> [!tip]
> Start with `Off` to understand application resource consumption before enabling automatic updates.

> [!tip]
> `Auto` is the preferred mode for most stateless production workloads.

> [!tip]
> Use `Initial` for workloads already recreated frequently through normal deployment pipelines — you get the benefit of updated resources at each deployment without additional restarts.

> [!warning]
> Do not enable automatic updates for applications that cannot tolerate Pod restarts without first validating their availability strategy and configuring appropriate Pod Disruption Budgets.

> [!note]
> Update Modes determine **when** recommendations are applied — not **how** they are calculated. The Recommender runs in the same way regardless of mode.

---

## Key Takeaways

- VPA supports four update modes: **Off**, **Initial**, **Auto**, and **Recreate**
- Every mode generates recommendations — they differ only in how those recommendations are applied
- `Off` is ideal for evaluation and capacity planning with no risk of unexpected restarts
- `Initial` applies recommendations only at Pod creation, with no ongoing disruption
- `Auto` provides continuous optimization and is the recommended mode for cloud-native workloads
- Choosing the correct mode is essential for balancing automation with application availability
