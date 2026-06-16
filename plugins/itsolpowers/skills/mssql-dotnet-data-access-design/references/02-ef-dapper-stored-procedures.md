# EF Dapper And Stored Procedures

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
