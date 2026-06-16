# Schema Query And Stored Procedures

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
