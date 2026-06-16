# Query Performance Transactions And Migrations

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
