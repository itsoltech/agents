# MSSQL Review Guide

Use this guide to review SQL Server changes in .NET applications using EF Core, Dapper, stored procedures, migrations, and production database operations.

## Findings Standard

Report only actionable issues. For each finding include:

- severity
- file reference
- affected behavior or data risk
- why the current change is unsafe or incorrect
- concrete fix or verification needed

Do not report generic best-practice advice unless it materially affects the reviewed change.

## Review Coverage Map

For every PR touching SQL Server, build a coverage map:

- schema and constraints
- queries and execution shape
- indexes and statistics impact
- EF Core model, LINQ, migrations, and tracking
- Dapper SQL and DTO mapping
- stored procedures and result-set contracts
- transaction and isolation boundaries
- tenant isolation and permissions
- migration rollout, backfill, rollback/roll-forward
- monitoring, backup, restore, HA, or operational impact
- tests or replacement verification

## Schema Review

Check:

- table purpose, owner, and access pattern are clear.
- primary keys, foreign keys, unique constraints, check constraints, and default constraints protect invariants.
- nullable columns are intentional.
- data types match domain and query usage.
- timestamps use UTC and appropriate precision.
- soft delete has uniqueness, restore, retention, and filtering behavior defined.
- tenant-owned rows have consistent `TenantId` strategy.

Red flags:

- missing constraints because "the app validates it".
- oversized text columns by default.
- money represented as floating point.
- local-time timestamps without clear conversion rules.
- multi-tenant uniqueness missing tenant scope.

## Query And Index Review

Check:

- queries select only needed columns.
- predicates are SARGable.
- parameters match column types and lengths.
- pagination strategy is safe for expected volume.
- optional filters do not create one unstable mega-query.
- indexes match real predicates, joins, sorting, and cardinality.
- included columns are used to cover reads without bloating key columns.

Red flags:

- `NOLOCK` used as a default blocking fix.
- `MERGE` without strong concurrency tests.
- functions applied to indexed columns in predicates.
- implicit conversions visible or likely.
- indexes added without a named query and expected plan.
- duplicate or very wide indexes.

## Stored Procedure Review

Check:

- procedure has stable, schema-qualified name and explicit parameters.
- `SET NOCOUNT ON` is present.
- transaction ownership is clear.
- errors are handled consistently.
- result sets are explicit and predictable.
- dynamic SQL uses `sp_executesql` with parameters.
- procedure does not compose API response JSON as the main app contract.

Red flags:

- `PayloadJson` or `nvarchar(max)` JSON returned as primary response.
- hidden domain logic that should live in application code.
- dozens of optional parameters controlling one huge procedure.
- string-concatenated dynamic SQL.
- result-set shape changes depending on branch.

## EF Core Review

Check:

- `DbContext` lifetime is scoped correctly.
- read-only queries use no tracking where appropriate.
- important queries project to DTO/read model instead of loading full entities.
- `Include` is bounded and not hiding N+1 or over-fetching.
- raw SQL is parameterized.
- generated migration SQL is reviewed for locks, table size, and rollout order.
- global query filters protect tenant/soft-delete behavior without hiding bugs.

Red flags:

- broad `Include` chains on list endpoints.
- accidental N+1 queries.
- migrations that rewrite large tables synchronously.
- raw SQL interpolation.
- app code treating `DbContext` as a singleton or cross-request store.

## Dapper Review

Check:

- SQL is parameterized.
- DTO mapping is stable and tested for important reads.
- text parameters have explicit type/length when needed.
- `QueryMultiple` result order matches DTO assembly.
- buffered/unbuffered mode is intentional.
- Dapper and EF Core share connection/transaction when in one unit of work.

Red flags:

- string-built SQL from user input.
- copied SQL fragments drifting between files.
- untested column-to-property mapping.
- separate EF and Dapper transactions that are assumed to be one.

## Migration And Backfill Review

Check:

- rollout follows expand-contract when compatibility matters.
- migration can be stopped, retried, or rolled forward.
- backfill is batched and observable.
- large index operations consider online/resumable options where supported.
- data correction scripts are idempotent or guarded.
- deployment order is explicit.

Red flags:

- destructive migration in the same release as app dependency.
- large backfill in one transaction.
- migration depends on perfect production data without validation.
- rollback plan ignores already-written data.

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
