---
title: 14 - HPA Best Practices
description: Production recommendations for designing reliable and efficient Horizontal Pod Autoscaler configurations.
---

# 14 - HPA Best Practices

Configuring an HPA is relatively straightforward. Designing an autoscaling strategy that performs well in production is significantly more challenging. Poorly chosen metrics or thresholds lead to under-provisioned services, excessive scaling events, or unnecessary infrastructure costs.

---

## Design for Horizontal Scaling

HPA performs best when each Pod is independent and interchangeable — any request should reach any replica without affecting behavior. Applications that depend on local state or in-memory sessions are poor candidates for horizontal scaling.

---

## Choose the Right Metric

> Does this metric accurately represent workload demand?

**Good metrics:**
- CPU utilization for stateless APIs
- HTTP requests per second
- Queue length / consumer lag
- Active worker count
- Business transactions

**Poor metrics:**
- Disk usage
- Temporary memory spikes
- Random internal counters
- Metrics unrelated to user activity

The HPA should scale because users require additional capacity — not because an unrelated resource happened to change.

---

## Define Resource Requests

Every container must define CPU and memory requests:

```yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1
    memory: 1Gi
```

> [!important]
> CPU-based autoscaling depends on **requests**, not limits. Without resource requests, utilization cannot be calculated and HPA will fail to scale correctly.

---

## Avoid Extreme Thresholds

`averageUtilization: 20` causes excessive scaling under light load. `averageUtilization: 95` delays scaling until the application is already overloaded.

A target between **60–75% CPU utilization** is a reasonable starting point for stateless applications — adjust based on your workload's actual behavior.

---

## Configure Realistic Replica Limits

```yaml
minReplicas: 2
maxReplicas: 20
```

Limits should reflect expected traffic, cluster capacity, startup time, and budget. Avoid `maxReplicas: 1000` unless there is a clear operational requirement.

---

## Scale Up Aggressively, Scale Down Conservatively

Users notice insufficient capacity far faster than excess capacity.

```yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 0    # react immediately
  scaleDown:
    stabilizationWindowSeconds: 300  # default, appropriate for most workloads
```

The Kubernetes default of 300 seconds for scale-down is appropriate for most production workloads.

---

## Ensure Fast Pod Startup

HPA can only help if new Pods become available quickly. Applications with startup times of several minutes will still struggle during sudden spikes.

- Optimize application startup
- Reduce container image size
- Minimize initialization work
- Delay non-essential background tasks until after startup

---

## Configure Readiness Probes

Without a readiness probe, Kubernetes may send traffic to Pods still initializing:

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
```

Misleading traffic during startup produces misleading autoscaling metrics.

---

## Monitor Your Autoscaler

```bash
kubectl get hpa
kubectl describe hpa <name>
kubectl top pods
```

Monitor scaling events, replica counts, metric values, failed scaling attempts, and pending Pods. Continuous monitoring allows thresholds and policies to be refined over time.

---

## Test Under Load

Validate autoscaling before production — not during an incident. Use tools like **k6**, **Locust**, **JMeter**, or **Vegeta** and observe:

- How quickly Pods are created
- How long until they become Ready
- Whether scaling policies behave as expected
- Application performance under sustained load

---

## Combine Autoscalers Carefully

HPA + Cluster Autoscaler: generally recommended and complementary.

HPA + VPA: requires careful planning. If both adjust CPU-related behavior simultaneously, conflicting decisions may occur. A safe approach is letting HPA handle CPU-based replica scaling while VPA adjusts memory — but validate this for each workload.

---

## Leave Spare Cluster Capacity

Relying entirely on the Cluster Autoscaler introduces latency:

```
HPA creates Pods → No nodes available → CA provisions VM → Node boots → Pods scheduled
```

This can take several minutes. Keeping some unused capacity allows new Pods to start immediately while additional nodes are provisioned.

---

## Continuously Improve

Autoscaling is not "configure once and forget". Applications evolve, traffic patterns change, infrastructure changes. Review metrics periodically to ensure they still represent actual demand.

---

## Production Checklist

Before deploying an HPA to production:

- [ ] CPU and memory requests are configured on all containers
- [ ] Appropriate scaling metrics have been selected
- [ ] `minReplicas` and `maxReplicas` are realistic
- [ ] Scale-up policies are responsive
- [ ] Scale-down policies are conservative
- [ ] Readiness probes are configured
- [ ] Metrics Server (or Metrics Adapter) is healthy
- [ ] Load testing has been performed
- [ ] Monitoring dashboards are in place
- [ ] Sufficient cluster capacity exists

---

## Key Takeaways

- Horizontal scaling starts with application design — stateless, interchangeable Pods
- Good metrics are more valuable than complex scaling policies
- Resource requests are essential for CPU-based autoscaling
- Aggressive scale-up + conservative scale-down provides the best balance
- Test under realistic load before going to production
- Treat autoscaling as an iterative optimization process, not a one-time task
