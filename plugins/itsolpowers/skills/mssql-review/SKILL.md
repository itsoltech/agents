---
name: mssql-review
description: "SQL Server review: MSSQL schema, migrations, queries, indexes, EF Core, Dapper, stored procedures, transactions, security, backup, and operational risk."
---

# MSSQL Review

Use this skill when reviewing SQL Server, EF Core, Dapper, stored procedure, migration, or database-backed .NET application changes.

## Process

1. Inspect the diff, surrounding data access code, migrations, stored procedures, configs, and tests before applying checklist items.
2. Read [references/guide.md](references/guide.md) before producing review findings.
3. Check correctness, data integrity, tenant isolation, SQL injection risk, query shape, migration safety, locks, transactions, performance, observability, backup/DR impact, and tests.
4. Lead with concrete findings by severity, with file references, affected behavior, and missing verification.
5. Separate confirmed bugs from risks, questions, and follow-up suggestions.

## Large PR Subagent Review

For large pull requests, use focused subagents before producing the final review. Split by risk area such as schema/migrations, EF Core, Dapper/procedures, security/tenant boundaries, performance/indexing, operational readiness, or QA.

The main agent consolidates subagent findings, removes duplicates, resolves conflicts, decides final severity, and writes the final review summary.

## Coordination

Use with `itsol-code-review-workflow` for PR review process, `mssql-dotnet-data-access-design` for intended implementation patterns, `mssql-operations-debugging` for performance/incident evidence, and focused `security-*` or `infra-*` skills for trust boundaries or production deployment risk.
