# Evidence And Query Diagnostics

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
