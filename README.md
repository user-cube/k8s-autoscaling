# Kubernetes Autoscaling Notes

Study notes on Kubernetes autoscaling — from pod-level scaling (HPA, VPA) to
cluster-level node provisioning (Cluster Autoscaler) and event-driven scaling (KEDA).

Published at **[k8s-autoscaling.ruicoelho.dev](https://k8s-autoscaling.ruicoelho.dev)**,
built with [Quartz](https://quartz.jzhao.xyz) and deployed to GitHub Pages on every push to `main`.

## Contents

| Section | Topics |
|---|---|
| `01 - Foundations` | Why autoscaling matters, scaling layers, how the autoscalers fit together |
| `02 - Horizontal Pod Autoscaler` | HPA v2, metrics sources, scaling policies, stabilization windows, troubleshooting |
| `03 - Vertical Pod Autoscaler` | VPA components, update modes, CRD, limitations, best practices |
| `04 - Cluster Proportional Autoscaler` | CPA architecture, linear and ladder algorithms, configuration |
| `05 - Pod Priority and Preemption` | PriorityClass, the preemption process, scheduling policies |
| `06 - Cluster Autoscaler` | Node provisioning, scale-down, node groups, expander strategies |
| `07 - KEDA` | Event-driven autoscaling, scalers, scale to zero, HPA integration |

All notes live under [`content/`](content/) as plain Markdown, one folder per section.
Files are numbered so they read in order, and pages cross-reference each other with
Obsidian-style `[[wiki links]]`.

## Running locally

Requires Node.js 22+ and npm 10.9+.

```bash
npm ci
npx quartz build --serve
```

The site is served at `http://localhost:8080`.

| Command | What it does |
|---|---|
| `npx quartz build --serve` | Build and serve with live reload |
| `npm run check` | Type-check and verify formatting |
| `npm run format` | Format everything with Prettier |

## Contributing

Corrections and additions are welcome — open an issue or a pull request.
Keep new pages inside the numbered section folders and follow the existing
front matter (`title`, `description`).

## License

Quartz is MIT licensed (see [LICENSE.txt](LICENSE.txt)). The notes under `content/`
are the author's own work.
