---
name: dotnet-web-api-implementation
description: ".NET API implementation: DTOs, validation, OpenAPI, auth, EF Core, jobs, tests."
---

# Dotnet Web API Implementation

Keep architecture proportional: implement a clear API contract, validation, error handling, persistence boundary, observability, and tests without overbuilding patterns.

## Process

1. Inspect existing project conventions before introducing new structure.
2. Define the contract, data flow, error behavior, permissions, observability, and tests before editing.
3. Make the smallest coherent change that satisfies the behavior.
4. Run focused verification and use `itsol-self-review` before handoff.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Cel dokumentu; Główna zasada; Dobór architektury do rozmiaru aplikacji
- [02-clean-architecture.md](./references/02-clean-architecture.md) - Clean architecture; DDD; CQRS; MediatR i pipeline handlers
- [Shared Program.cs and application composition](../_shared/references/dotnet-web-api/program-composition.md) - wspólne fakty dla implementacji: middleware, DI, options, DTO, validation i ProblemDetails
- [Shared API design](../_shared/references/dotnet-web-api/api-design.md) - wspólne fakty dla implementacji: OpenAPI, auth, browser security, secrets, HTTP, EF Core i transakcje
- [05-background-jobs.md](./references/05-background-jobs.md) - Background jobs; Cache; Rate limiting i abuse protection; Health checks
- [06-bezpieczenstwo-code-review.md](./references/06-bezpieczenstwo-code-review.md) - Bezpieczeństwo code review; Analizatory, warningi i jakość kodu; CI; Deployment i kontenery z perspektywy aplikacji
