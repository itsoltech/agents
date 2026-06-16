# MSSQL .NET Data Access Design Guide

This guide is self-contained for ITSOL agents. Use it for SQL Server features in .NET apps using EF Core, Dapper, stored procedures, and migrations.

## Core Principles

- Design the database around real application access patterns.
- Treat constraints as data safety, not optional documentation.
- Give every production table a clear owner, purpose, access pattern, retention story, and indexing strategy.
- Fetch only the data needed by the use case.
- Do not use `NOLOCK` as a default fix for blocking.
- Do not add indexes "just in case"; tie each index to a real query and expected plan.
- Do not run heavy production migrations without rollback or roll-forward plan, backup posture, and expected duration.
- Diagnose performance from metrics, Query Store, execution plans, wait stats, and recent changes, not intuition.

## EF Core, Dapper, Stored Procedures

Use EF Core when:

- CRUD maps naturally to the domain model.
- Change tracking and `SaveChanges` are useful.
- relationships make sense in code.
- migrations, LINQ, conventions, and global query filters add value.
- generated SQL is inspectable and testable.

Prefer Dapper when:

- you need precise SQL control.
- the output is a read model, report, dashboard, export, or endpoint-specific DTO.
- the query is optimized for one use case.
- multiple result sets with `QueryMultiple` are clearer than entity loading.

Use stored procedures when:

- work must happen close to data in one transaction.
- batch update, import, deduplication, correction, or operational control matters.
- reducing round trips is material.
- DBAs or ops need stable rollout and plan control.
- the procedure is a stable contract for more than one service.

Avoid stored procedures for simple CRUD, API response composition, HTML/text formatting, nested DTO construction, or untestable domain logic.

## Stored Procedures Must Not Return JSON As The Main Contract

Stored procedures should return explicit result sets, not JSON payloads.

Avoid:

- `nvarchar(max)` JSON as the procedure response.
- one `PayloadJson` field as the application contract.
- nested DTOs built by `FOR JSON PATH`.
- dynamic JSON shape controlled by parameters.
- JSON as a substitute for multiple result sets.

Prefer:

- stable input parameters.
- explicit result-set columns.
- multiple result sets for parent and child data.
- DTO composition, naming policy, nullability, and API compatibility in .NET code.

Allowed narrow JSON cases:

- raw external integration payload snapshots.
- audit snapshots where text shape matters.
- feature-specific metadata when schema is intentionally flexible and indexed access is not expected.

## Data Modeling

- Start from queries, commands, consistency rules, and retention needs.
- Normalize data when it protects integrity and avoids contradictory state.
- Denormalize only for a known read path, with clear update ownership.
- Use primary keys, foreign keys, unique constraints, check constraints, and default constraints intentionally.
- Choose data types precisely: avoid oversized strings, accidental `nvarchar(max)`, floats for money, and local-time ambiguity.
- Prefer `datetime2` and UTC for application timestamps.
- Use soft delete only when the business needs recovery, audit, or historical visibility; otherwise prefer explicit archival or hard delete.
- If using soft delete, define uniqueness behavior, query filters, restore behavior, retention, and indexes.

## Multi-Tenancy

Common variants:

- one database with `TenantId`
- separate schemas
- separate databases

For one database with `TenantId`:

- every tenant-owned table needs `TenantId`.
- tenant predicates must be applied consistently.
- unique constraints often need tenant scope.
- indexes should reflect tenant-first access patterns where appropriate.

Consider Row-Level Security only when the team can own policy complexity, debugging, migration impact, and performance testing.

## Indexing

- Design indexes from concrete predicates, joins, ordering, pagination, and expected selectivity.
- Put equality predicates before range predicates in composite indexes when that matches the query.
- Use included columns to cover reads without bloating key columns.
- Use filtered indexes for common narrow subsets, such as active rows or non-null states.
- Avoid duplicate indexes, low-selectivity indexes without purpose, wide key indexes, and indexes unused by real workload.
- Fragmentation maintenance is not a universal fix; stale statistics and bad query shape often matter more.

## Query Writing

- Select only needed columns.
- Prefer keyset pagination for deep or high-volume paging.
- Keep predicates SARGable: avoid wrapping indexed columns in functions.
- Avoid implicit conversions caused by type mismatches between parameters and columns.
- Be careful with optional filters. One query with many optional predicates can produce bad plans; consider separate query shapes or dynamic SQL with parameters.
- Avoid `NOLOCK`; it can return dirty, missing, duplicated, or inconsistent rows.
- Avoid `MERGE` unless the team has a strong reason and tests concurrency carefully.

## Stored Procedure Standards

A write procedure should normally include:

- stable schema-qualified name.
- explicit parameters with exact SQL types.
- `SET NOCOUNT ON`.
- `XACT_ABORT ON` when appropriate.
- transaction boundary only when the procedure owns the full unit of work.
- clear error behavior.
- predictable result shape.
- no hidden API formatting.

Dynamic SQL must be parameterized with `sp_executesql`; never concatenate user input.

## EF Core Standards

- Keep `DbContext` scoped per unit of work, not singleton.
- Use no-tracking queries for read-only paths.
- Project to DTO/read model instead of loading full entities when updating is not needed.
- Avoid accidental broad `Include`; prefer explicit projection.
- Inspect generated SQL for important queries.
- Use raw SQL only with parameters and clear ownership.
- Treat EF migrations as code: review generated SQL, rollout impact, locks, data size, and rollback strategy.

## Dapper Standards

- Always parameterize SQL.
- Keep SQL discoverable and owned by one use case or repository.
- Test DTO mapping for important read models.
- Use `QueryMultiple` for stable multiple result sets.
- Choose buffered vs unbuffered intentionally; streaming large outputs affects connection lifetime.
- Align text parameter types and lengths with SQL columns to avoid implicit conversions.

## EF Core And Dapper In One Transaction

When mixing EF Core and Dapper in one unit of work:

- share the same `DbConnection`.
- share the same `DbTransaction`.
- avoid two independent transactions that only look connected in code.
- keep ordering explicit: Dapper reads/writes may need EF `SaveChanges` before or after.

## Connection Pooling And Capacity

- Use pooling defaults intentionally and tune only with evidence.
- Avoid creating new connection strings per tenant/user/request unless required.
- Close/dispose connections promptly.
- Capacity-plan max pool size against app instances, background workers, database limits, and peak concurrency.

## Transactions, Isolation, Blocking

- Keep transactions short and bounded.
- Do not include external API calls, user interaction, or long CPU work inside DB transactions.
- Pick isolation level based on correctness, not guesswork.
- Investigate blocking with wait chains, locks, transaction duration, and query plans.
- For deadlocks, capture deadlock graph and fix ordering, indexes, transaction scope, or isolation.

## Migration Safety

Prefer expand-contract rollout:

1. Add compatible schema.
2. Deploy app that writes both or reads both if needed.
3. Backfill safely in batches.
4. Switch reads.
5. Remove old schema later.

Backfills should be batchable, resumable, observable, and safe to stop. Large indexes may require online/resumable options depending on SQL Server edition/version.

## Testing And QA

- Use integration tests for repository/procedure behavior when feasible.
- Test constraints, uniqueness, tenant boundaries, nullability, time zones, pagination, concurrency, and rollback paths.
- Use deterministic seed data.
- For legacy projects without test harness, follow `.itsol.md` repo policy and document replacement verification.

## New Feature Checklist

- Access patterns and cardinality are explicit.
- Schema constraints protect critical invariants.
- EF Core/Dapper/procedure choice is justified.
- Queries are parameterized and SARGable.
- Indexes match real predicates/order.
- Transaction boundary and isolation are clear.
- Migration rollout and backfill are safe.
- Security and tenant boundaries are covered.
- Tests or replacement verification are planned.
