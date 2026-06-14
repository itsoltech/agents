---
name: infra-secrets-config
description: Use when implementing or reviewing infrastructure secrets, runtime config, Vault, Nomad templates, environment variables, TLS secrets, registry credentials, CI/CD deployment credentials, or host-level secret access.
---

# Infra Secrets Config

Review where secrets live, how they reach runtime, who can read them, and whether logs/images/state can leak them.

## Process

1. Map the request path or operational path end to end.
2. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
3. Check rollout, rollback, observability, security, secrets, resource limits, and failure behavior.
4. For review, report concrete production risks first, then maintainability issues.
5. For debugging, collect evidence from config, allocation/container state, logs, metrics, and recent changes before proposing fixes.

## Evidence

Prefer job specs, Dockerfiles, proxy config, deployment manifests, logs, metrics, health checks, and runbook steps over assumptions.

