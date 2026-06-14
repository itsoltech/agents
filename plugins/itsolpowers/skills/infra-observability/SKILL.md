---
name: infra-observability
description: Use when implementing or reviewing infrastructure logging, metrics, tracing, alerting, dashboards, SLOs, health checks, Nomad diagnostics, log cardinality, production troubleshooting, or monitoring coverage.
---

# Infra Observability

Review whether failures are visible, actionable, correlated, and low-cardinality enough for production use.

## Process

1. Map the request path or operational path end to end.
2. Read [references/guide.md](references/guide.md); it contains the ITSOL infrastructure knowledge extracted for this skill.
3. Check rollout, rollback, observability, security, secrets, resource limits, and failure behavior.
4. For review, report concrete production risks first, then maintainability issues.
5. For debugging, collect evidence from config, allocation/container state, logs, metrics, and recent changes before proposing fixes.

## Evidence

Prefer job specs, Dockerfiles, proxy config, deployment manifests, logs, metrics, health checks, and runbook steps over assumptions.

