---
name: infra-container-runtime-review
description: "Container runtime review: env, secrets, health checks, resources, volumes, shutdown."
---

# Infra Container Runtime Review

Review runtime limits, health checks, lifecycle, persistent state, restart behavior, environment, and operational diagnostics.

## Process

1. Map the request path or operational path end to end.
2. Check rollout, rollback, observability, security, secrets, resource limits, and failure behavior.
3. For review, report concrete production risks first, then maintainability issues.
4. For debugging, collect evidence from config, allocation/container state, logs, metrics, and recent changes before proposing fixes.

## Large PR Subagent Review

For broad or materially risky pull requests, recommend focused additional review only when independent expertise is likely to improve the verdict. Judge this from concrete risk, novelty, blast radius, reversibility, and context size—not file count or category matching alone. Small and conventional changes should remain one pragmatic pass.

When additional reviewers add value, split only by independent material surfaces. Each returns concrete evidence-based findings; the main agent removes duplicates and false positives and owns the proportional final verdict.

## Evidence

Prefer job specs, Dockerfiles, proxy config, deployment manifests, logs, metrics, health checks, and runbook steps over assumptions.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Runtime kontenerów; Health checks; Docker Compose na produkcji
- [Shared infrastructure review checklist](../_shared/references/infrastructure/container-review-checklist.md) - wspólne fakty i bramka review; zastosuj je do zachowania runtime opisanego wyżej
