---
name: postgres-operations-debugging
description: Use when diagnosing PostgreSQL slow queries, high CPU, high RAM, OOM, disk growth, replication lag, lock contention, autovacuum issues, PgBouncer problems, connection exhaustion, backup or restore failures, HA/failover, or production database incidents.
---

# Postgres Operations Debugging

Debug PostgreSQL incidents with evidence from plans, locks, connections, logs, metrics, replication state, vacuum state, and recent migrations before changing settings.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
4. Isolate the boundary that fails and compare it with a known working path.
5. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

