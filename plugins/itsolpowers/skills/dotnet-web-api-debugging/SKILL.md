---
name: dotnet-web-api-debugging
description: ".NET API debugging: auth, EF Core, jobs, cache, health, observability, incidents."
---

# Dotnet Web API Debugging

Debug through middleware, endpoint, validation, domain, data, integration, cache, job, and deployment layers using logs and traces before changing code.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Isolate the boundary that fails and compare it with a known working path.
4. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Program.cs i składanie aplikacji; Middleware; Dependency injection
- [02-data-protection-i-wiele-instancji.md](./references/02-data-protection-i-wiele-instancji.md) - Data Protection i wiele instancji; Komunikacja HTTP z innymi usługami; EF Core i dostęp do danych; Transakcje i spójność
- [03-debugowanie-produkcyjnych-problemow.md](./references/03-debugowanie-produkcyjnych-problemow.md) - Debugowanie produkcyjnych problemów; Wydajność aplikacji; Skalowanie aplikacji; Rodzaje testów
- [04-migracje-bazy.md](./references/04-migracje-bazy.md) - Migracje bazy; Kiedy przemyśleć refactor; Upgrade do nowszej wersji .NET
