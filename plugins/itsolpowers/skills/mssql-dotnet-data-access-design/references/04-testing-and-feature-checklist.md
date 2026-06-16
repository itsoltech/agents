# Testing And Feature Checklist

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
