---
name: infra-nomad-deployment
description: "Nomad deployment: jobs, canaries, rollback, templates, Vault, constraints, runtime."
---

# Infra Nomad Deployment

Review Nomad job specs through allocation lifecycle, service discovery, secrets, update strategy, resources, and failure behavior.

## Process

1. Map the request path or operational path end to end.
2. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
3. Check rollout, rollback, observability, security, secrets, resource limits, and failure behavior.
4. For review, report concrete production risks first, then maintainability issues.
5. For debugging, collect evidence from config, allocation/container state, logs, metrics, and recent changes before proposing fixes.

## Evidence

Prefer job specs, Dockerfiles, proxy config, deployment manifests, logs, metrics, health checks, and runbook steps over assumptions.

