---
name: dotnet-web-api-review
description: Use when reviewing .NET or ASP.NET Core API code, architecture, endpoints, DTOs, validation, auth, CORS, EF Core, transactions, background jobs, caching, rate limiting, observability, tests, CI, deployment, or migrations.
---

# Dotnet Web API Review

Review API changes for proportional architecture, contract clarity, validation, security, data consistency, async behavior, observability, and test coverage.

## Process

1. Inspect the diff and surrounding code before applying checklist items.
2. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
3. Check correctness, boundaries, security, data flow, observability, tests, and deployment impact for the changed behavior.
4. Report concrete findings first, ordered by severity, with file references and affected behavior.
5. Call out missing tests or residual risk only when it is tied to the reviewed change.

## Large PR Subagent Review

For large pull requests, you must use subagents before producing the final review. Treat a PR as large when it touches multiple domains, many files, generated plus handwritten code, security-sensitive paths, database behavior, infrastructure, or several independent risk areas.

Split the review by independent surfaces such as UI, API, database, infrastructure, security, generated clients, tests, or performance. Each subagent should inspect one narrow area and return concrete findings with file references, severity, affected behavior, and missing verification. The main agent consolidates those findings, removes duplicates, resolves conflicts, decides the final verdict, and writes the final review summary.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

