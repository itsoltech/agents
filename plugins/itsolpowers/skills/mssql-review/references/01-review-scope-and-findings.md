# Review Scope And Findings

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
