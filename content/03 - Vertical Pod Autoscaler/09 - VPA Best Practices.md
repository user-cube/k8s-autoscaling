---
title: 09 - VPA Best Practices
description: Production recommendations for designing safe and effective Vertical Pod Autoscaler deployments.
---

# 09 - VPA Best Practices

The Vertical Pod Autoscaler can significantly improve resource utilization and reduce the operational effort required to tune Kubernetes workloads. However, automatic resource optimization also introduces new operational considerations.

Choosing the correct update mode, understanding application behavior, and carefully monitoring recommendations are all essential for a successful deployment.

---

## Start with Recommendation Mode

The safest way to introduce the VPA is to begin with **Off** mode:

```yaml
updatePolicy:
  updateMode: Off
```

In this mode, the VPA continuously analyzes workloads but never replaces Pods. This allows engineers to answer important questions before enabling automation:

- Are the recommendations reasonable?
- Is the application consistently over-provisioned?
- Are memory recommendations increasing unexpectedly?
- How stable are the recommendations over time?

Recommendation mode provides valuable operational insight without introducing any risk.

---

## Allow Time for Learning

The Recommender becomes more accurate as it collects additional resource usage data. Immediately after deployment there is very little historical data available; after several days or weeks, recommendations become significantly more accurate.

Avoid evaluating VPA recommendations immediately after installation. Allow workloads to experience normal production traffic before drawing conclusions.

---

## Define Resource Boundaries

Always define minimum and maximum resource limits:

```yaml
resourcePolicy:
  containerPolicies:
    - containerName: "*"
      minAllowed:
        cpu: 250m
        memory: 256Mi
      maxAllowed:
        cpu: "4"
        memory: 8Gi
```

Without these limits, recommendations may grow unexpectedly during unusual workload conditions. Resource boundaries also protect against application bugs, memory leaks, and temporary workload anomalies.

---

## Choose the Correct Update Mode

Different workloads require different operational strategies:

| Workload | Recommended Mode |
|---|---|
| Production Database | Off |
| Stateful Applications | Initial |
| Web Applications | Auto |
| Development Clusters | Auto |
| Batch / Short-Lived Workloads | Initial |

The update mode should reflect the workload's tolerance for Pod recreation.

---

## Deploy Multiple Replicas

Whenever possible, applications should run more than one replica. The Updater can then replace one Pod while the remaining replicas continue serving traffic. Single-replica applications inevitably experience downtime whenever the VPA applies new resource requests.

---

## Configure Pod Disruption Budgets

Pod replacement should always respect workload availability:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: app-pdb
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: <your-app>
```

This prevents the Updater from evicting too many Pods simultaneously. Pod Disruption Budgets are particularly important for production deployments.

---

## Monitor Recommendations

The VPA should not be treated as a "set and forget" component. Regularly inspect recommendations:

```bash
kubectl describe vpa <vpa-name>
```

Review CPU and memory recommendations, trends, and sudden changes. Large recommendation shifts often indicate changes in application behavior after new releases.

---

## Validate Resource Changes

Before enabling automatic updates, verify that recommended resources make sense. A recommendation jumping from `512Mi` to `12Gi` should trigger investigation before being applied — possible causes include memory leaks, configuration errors, or unusual workload patterns. The VPA should never replace proper application monitoring.

---

## Optimize Application Startup

Every automatic update requires a replacement Pod. Applications should start quickly, initialize efficiently, expose readiness probes, and minimize startup dependencies. Fast startup minimizes the impact of automatic resource updates.

---

## Combine with the Cluster Autoscaler

Increasing resource requests may require larger Worker Nodes. If no suitable node is available, the replacement Pod remains `Pending`. Combining the VPA with the Cluster Autoscaler allows the infrastructure to expand when larger Pods can no longer be scheduled.

---

## Be Careful with HPA

Running the HPA and VPA together is possible, but only when they optimize different dimensions:

```
HPA  →  Replica Count
VPA  →  Memory Requests
```

Avoid configurations where both controllers modify CPU-related behavior simultaneously.

---

## Test Before Production

Validate VPA behavior under realistic workloads before enabling automatic updates. Observe recommendation accuracy, Pod replacement frequency, application recovery time, scheduling behavior, and cluster resource utilization.

---

## Review Recommendations Regularly

Applications evolve over time. A recommendation generated today may no longer be appropriate six months later. Regular reviews help identify inefficient resource allocation, application regressions, unexpected workload changes, and optimization opportunities. Treat VPA recommendations as operational feedback rather than static configuration.

---

## Production Checklist

Before enabling automatic VPA updates, verify:

- [ ] Resource requests are already defined
- [ ] Recommendation mode has been evaluated
- [ ] Resource boundaries (`minAllowed` / `maxAllowed`) are configured
- [ ] Pod Disruption Budgets are in place
- [ ] Applications have multiple replicas where possible
- [ ] Readiness probes are configured
- [ ] Startup times are acceptable
- [ ] Monitoring dashboards are available
- [ ] Cluster capacity is sufficient

---

## Best Practices Summary

| Recommendation | Reason |
|---|---|
| Start in **Off** mode | Validate recommendations safely |
| Configure `minAllowed` and `maxAllowed` | Prevent unrealistic recommendations |
| Use multiple replicas | Reduce disruption during Pod replacement |
| Deploy Pod Disruption Budgets | Maintain application availability |
| Monitor recommendations continuously | Detect changing workload behavior |
| Optimize startup time | Minimize replacement impact |
| Combine carefully with HPA | Avoid conflicting autoscaling decisions |
| Test under realistic load | Validate recommendations before production |

---

## Key Takeaways

- Begin with recommendation-only mode before enabling automatic updates
- Allow the Recommender sufficient time to learn application behavior
- Protect workloads using Pod Disruption Budgets and multiple replicas
- Define sensible minimum and maximum resource limits
- Review recommendations regularly as applications evolve
- Treat the VPA as an optimization tool that complements — not replaces — application monitoring and performance engineering
