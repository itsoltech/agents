---
name: dotnet-web-api-review
description: "Review .NET API contracts, validation, auth, EF Core, jobs, deployment, and tests."
---

# Dotnet Web API Review

Review API changes for proportional architecture, contract clarity, validation, security, data consistency, async behavior, observability, and test coverage.

## Process

1. Inspect the diff and surrounding code before applying checklist items.
2. Check correctness, boundaries, security, data flow, observability, tests, and deployment impact for the changed behavior.
3. Report concrete findings first, ordered by severity, with file references and affected behavior.
4. Call out missing tests or residual risk only when it is tied to the reviewed change.

## Large PR Subagent Review

For broad or materially risky pull requests, recommend focused additional review only when independent expertise is likely to improve the verdict. Judge this from concrete risk, novelty, blast radius, reversibility, and context size—not file count or category matching alone. Small and conventional changes should remain one pragmatic pass.

When additional reviewers add value, split only by independent material surfaces. Each returns concrete evidence-based findings; the main agent removes duplicates and false positives and owns the proportional final verdict.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Główna zasada; Dobór architektury do rozmiaru aplikacji; Vertical slice
- [02-ddd.md](./references/02-ddd.md) - DDD; CQRS; MediatR i pipeline handlers; Minimal APIs czy kontrolery
- [Shared Program.cs and application composition](../_shared/references/dotnet-web-api/program-composition.md) - wspólne fakty; oceń diff według review flow i zakresu tego skilla
- [Shared API design](../_shared/references/dotnet-web-api/api-design.md) - wspólne fakty; użyj ich jako rubryku kontraktu, bezpieczeństwa, danych i transakcji
- [05-background-jobs.md](./references/05-background-jobs.md) - Background jobs; Cache; Rate limiting i abuse protection; Health checks
- [06-deployment-i-kontenery-z-perspektywy-aplikacji.md](./references/06-deployment-i-kontenery-z-perspektywy-aplikacji.md) - Deployment i kontenery z perspektywy aplikacji; Migracje bazy; Kiedy przemyśleć refactor; Minimalny standard nowego API
- [07-przykladowy-szablon-pr.md](./references/07-przykladowy-szablon-pr.md) - Przykładowy szablon PR
