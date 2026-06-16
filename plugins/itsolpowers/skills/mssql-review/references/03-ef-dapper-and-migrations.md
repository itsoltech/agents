# EF Dapper And Migrations

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
