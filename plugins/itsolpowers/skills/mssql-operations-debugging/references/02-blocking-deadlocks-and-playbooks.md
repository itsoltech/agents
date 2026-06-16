# Blocking Deadlocks And Playbooks

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

## Incident Checklist

- impact and time window known.
- current mitigation chosen.
- root-cause hypothesis backed by evidence.
- Query Store/plan/wait/blocking evidence collected.
- recent deploy/migration/data change checked.
- rollback or roll-forward plan defined.
- verification query or metric defined.
- residual risk and follow-up actions documented.
