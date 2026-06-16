# Maintenance DR HA And Security

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
