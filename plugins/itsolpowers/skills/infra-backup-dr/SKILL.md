---
name: infra-backup-dr
description: Use when implementing or reviewing backups, PITR, restore tests, RPO/RTO, disaster recovery, stateful workloads, database recovery, object storage retention, or production data recovery procedures.
---

# Infra Backup DR

Review backup coverage, restore proof, RPO/RTO, ownership, retention, and rollback or roll-forward paths.

## Process

1. Map the request path or operational path end to end.
2. Read [references/guide.md](references/guide.md); it contains the ITSOL infrastructure knowledge extracted for this skill.
3. Check rollout, rollback, observability, security, secrets, resource limits, and failure behavior.
4. For review, report concrete production risks first, then maintainability issues.
5. For debugging, collect evidence from config, allocation/container state, logs, metrics, and recent changes before proposing fixes.

## Evidence

Prefer job specs, Dockerfiles, proxy config, deployment manifests, logs, metrics, health checks, and runbook steps over assumptions.

