---
name: infra-capacity-testing
description: "Capacity testing: load, stress, soak, sizing, bottlenecks, autoscaling readiness."
---

# Infra Capacity Testing

Review measured capacity, bottlenecks, scaling assumptions, limits, and alerts before production risk grows.

## Process

1. Map the request path or operational path end to end.
2. Read [references/guide.md](references/guide.md); it contains the ITSOL infrastructure knowledge extracted for this skill.
3. Check rollout, rollback, observability, security, secrets, resource limits, and failure behavior.
4. For review, report concrete production risks first, then maintainability issues.
5. For debugging, collect evidence from config, allocation/container state, logs, metrics, and recent changes before proposing fixes.

## Evidence

Prefer job specs, Dockerfiles, proxy config, deployment manifests, logs, metrics, health checks, and runbook steps over assumptions.

