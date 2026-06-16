# Security Operations And Tests

## Security Review

Check:

- least-privilege database accounts.
- application user cannot perform unrelated DDL/admin operations.
- SQL injection is blocked by parameters.
- sensitive data is not logged or exposed in diagnostics.
- tenant filters are applied in every relevant path.
- secrets and connection strings are not committed.

## Operational Review

Check whether the change affects:

- backup/restore assumptions.
- transaction log growth.
- Query Store usefulness.
- HA/failover behavior.
- read replica routing.
- maintenance jobs, statistics, DBCC CHECKDB, retention, or archive strategy.

If operational impact is material, require an explicit release/rollback/monitoring note.

## Test And QA Review

Expected verification can include:

- integration tests for repositories/procedures.
- migration dry-run or generated SQL review.
- query plan or Query Store evidence for hot paths.
- tenant isolation tests.
- concurrency/deadlock scenarios.
- manual QA for legacy projects with `.itsol.md` TDD exceptions.
