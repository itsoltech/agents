# MSSQL Operations Debugging Guide

Use this guide for SQL Server incidents and performance debugging in .NET applications.

## Evidence First

Before proposing a fix, gather:

- symptom and business impact.
- time window and affected endpoints/jobs/users/tenants.
- recent deployments, migrations, data backfills, index changes, config changes, or traffic changes.
- application logs and traces with correlation IDs where possible.
- Query Store data for regressed queries.
- actual execution plan when available.
- wait stats and blocking chains.
- deadlock graph for deadlocks.
- transaction log, tempdb, CPU, memory, IO, connection pool, and storage signals.

Do not jump straight to adding indexes, increasing timeouts, or adding `NOLOCK`.

## Query Store

Use Query Store to answer:

- which query regressed.
- whether a plan changed.
- which plan was faster before.
- duration, CPU, reads, writes, executions, and wait categories.
- whether regression aligns with deploy, stats update, parameter distribution, or data growth.

Possible fixes:

- query rewrite.
- index change tied to the actual query.
- stats update.
- plan forcing as a temporary mitigation with follow-up root-cause work.
- procedure/query shape split for parameter-sensitive paths.

## Execution Plans

Inspect:

- estimated vs actual rows.
- scans vs seeks.
- key lookups.
- joins and sort/hash spills.
- missing index suggestions as hints, not commands.
- implicit conversions.
- parameter sniffing symptoms.
- memory grants.

Tie any index or rewrite to the observed plan and expected workload.

## Wait Stats And Blocking

Use wait stats to classify the bottleneck:

- lock waits: transaction scope, missing index, write contention, isolation level.
- IO waits: query shape, missing indexes, storage pressure, large scans.
- CPU waits: expensive plan, scalar functions, bad joins, too many executions.
- memory grant waits: sorts/hashes, bad cardinality estimates.

For blocking, identify:

- blocker session and blocked sessions.
- open transaction duration.
- command text and wait resource.
- transaction isolation.
- recent migration/backfill/job activity.

## Deadlocks

For deadlocks:

- capture the deadlock graph.
- identify resources, statements, indexes, transaction order, and victim.
- fix consistent access order, transaction scope, missing index, isolation level, or retry policy.
- add retry only when the operation is idempotent or safe to repeat.

Do not hide deadlocks by only increasing timeout or adding broad retries.

## Slow Endpoint Playbook

1. Confirm whether the endpoint is slow in app code, DB, network, downstream service, or serialization.
2. Find the SQL query/procedure involved.
3. Compare Query Store before/after.
4. Inspect actual plan and parameters.
5. Check row counts and tenant-specific cardinality.
6. Check whether EF Core generated unexpected SQL or N+1 queries.
7. Check Dapper/procedure parameter types.
8. Fix the smallest root cause and verify with focused measurement.

## Timeout Playbook

Possible causes:

- blocking.
- bad plan.
- missing index.
- parameter sniffing.
- connection pool exhaustion.
- long transaction.
- migration/backfill contention.
- infrastructure pressure.

Do not only increase command timeout. First identify whether work is slow, blocked, queued for a connection, or repeatedly retried.

## High CPU Playbook

Check:

- top CPU queries in Query Store.
- plan regressions.
- scans over large tables.
- scalar functions or non-SARGable predicates.
- loops with high execution count.
- sudden traffic or job activity.
- parameter-sensitive plan behavior.

## Transaction Log Growth

Check:

- recovery model.
- log backup frequency.
- long-running transactions.
- bulk operations/backfills.
- index rebuilds.
- replication/AG send queue.
- disk capacity and autogrowth settings.

Fix by addressing the active cause. Shrinking log files is not a root-cause fix.

## Migrations And Backfills

When a migration causes symptoms:

- identify locks and blocking chain.
- check transaction scope.
- pause or stop batch if safe.
- verify rollback/roll-forward plan.
- reduce batch size or add resumability.
- move destructive contract step to a later release.

Large backfills should be batchable, resumable, observable, and safe to stop.

## Maintenance Checks

Regular production posture should include:

- DBCC CHECKDB strategy.
- statistics maintenance.
- index maintenance based on evidence.
- transaction log backup cadence.
- retention/archive jobs.
- restore tests.
- Query Store enabled and sized appropriately.
- monitoring for CPU, IO, memory, log, tempdb, waits, blocking, deadlocks, and failed jobs.

## Backup, Restore, DR

Backup is not enough without tested restore.

Clarify:

- recovery model.
- RPO/RTO.
- full, differential, and log backup schedule.
- restore test frequency.
- encryption and access to backups.
- point-in-time restore requirements.
- whether app deployment depends on database rollback or roll-forward.

## HA And Failover

For Always On / HA setups, check:

- application connection string behavior.
- MultiSubnetFailover where appropriate.
- read/write routing.
- read replica staleness and query suitability.
- retry behavior after failover.
- jobs and migrations targeting the primary only.
- monitoring of synchronization and send/redo queues.

## Security Signals

During incidents, avoid leaking sensitive data in diagnostics.

Check:

- SQL injection attempts or unsafe dynamic SQL.
- overprivileged app accounts.
- committed secrets or exposed connection strings.
- sensitive data in logs, traces, query text, or screenshots.

## Incident Checklist

- impact and time window known.
- current mitigation chosen.
- root-cause hypothesis backed by evidence.
- Query Store/plan/wait/blocking evidence collected.
- recent deploy/migration/data change checked.
- rollback or roll-forward plan defined.
- verification query or metric defined.
- residual risk and follow-up actions documented.
