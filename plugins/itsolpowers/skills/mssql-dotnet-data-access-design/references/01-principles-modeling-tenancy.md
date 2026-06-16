# Principles Modeling And Tenancy

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
