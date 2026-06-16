---
name: mssql-operations-debugging
description: "SQL Server operations debugging: MSSQL slow queries, Query Store, execution plans, wait stats, blocking, deadlocks, timeouts, transaction log growth, backups, restore, and HA."
---

# MSSQL Operations Debugging

Use this skill when diagnosing SQL Server production or pre-production issues in .NET systems: slow endpoints, timeouts, high CPU, blocking, deadlocks, log growth, failed migrations, backup/restore risk, failover issues, or connection pool pressure.

## Process

1. State expected behavior, actual symptom, user impact, affected time window, and recent changes.
2. Gather evidence from application logs, traces, metrics, Query Store, execution plans, wait stats, blocking/deadlock data, connection pool behavior, deployment history, and database maintenance state before proposing a fix.
3. Read [references/guide.md](references/guide.md) before diagnosing or changing code/config.
4. Isolate whether the root cause is query shape, missing/wrong index, parameter sniffing, locks, transaction scope, stats, connection pool pressure, migration/backfill, HA/failover, or infrastructure capacity.
5. Implement one root-cause fix or produce a technical fix plan with verification and rollback/roll-forward steps.

## Coordination

Use with `itsol-bug-debugging` for approved Technical Fix Plans, `mssql-review` for risk review, `dotnet-web-api-debugging` for API symptoms, and `infra-*` skills when the issue touches deployment, storage, backup, HA, monitoring, or capacity.
