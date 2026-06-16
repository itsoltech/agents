---
name: mssql-dotnet-data-access-design
description: "SQL Server .NET design: MSSQL schema, queries, EF Core, Dapper, stored procedures, transactions, migrations, indexes, and data access implementation."
---

# MSSQL Dotnet Data Access Design

Use this skill when designing or implementing SQL Server data access in .NET applications using EF Core, Dapper, stored procedures, migrations, transactions, indexing, or database-backed features.

## Process

1. Identify access patterns, write/read paths, expected cardinality, tenant boundaries, retention needs, and operational constraints before choosing schema or data-access style.
2. Choose EF Core, Dapper, stored procedures, or a combination per use case. Do not make it an ideological project-wide rule.
3. Read [references/guide.md](references/guide.md) before proposing schema, query, EF Core, Dapper, stored procedure, transaction, migration, or indexing changes.
4. Keep domain logic, DTO composition, API response formatting, and JSON serialization in the application unless there is a narrow, explicitly justified exception.
5. Design rollout, rollback or roll-forward, verification, and observability together with the code change.

## Coordination

Use with `dotnet-web-api-implementation` for ASP.NET Core behavior, `mssql-review` before handoff, `mssql-operations-debugging` for production symptoms, and focused `security-*` or `infra-*` skills when the change touches permissions, secrets, deployment, backup, HA, or production readiness.
