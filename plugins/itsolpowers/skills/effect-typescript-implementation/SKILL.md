---
name: effect-typescript-implementation
description: "Implement Effect TS services, layers, schemas, resources, concurrency, and tests."
---

# Effect TypeScript Implementation

Use Effect to make failures, dependencies, resources, concurrency, and runtime validation explicit at system boundaries.

## Process

1. Inspect existing project conventions before introducing new structure.
2. Define the contract, data flow, error behavior, permissions, observability, and tests before editing.
3. Make the smallest coherent change that satisfies the behavior.
4. Run focused verification and use `itsol-self-review` before handoff.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Cel dokumentu; Założenia techniczne; Instalacja i konfiguracja
- [02-effect-gen-i-pipe.md](./references/02-effect-gen-i-pipe.md) - Effect.gen i pipe; Error model; Cause, Exit i diagnostyka błędów; API client i fetch
- [03-schema-i-walidacja-runtime.md](./references/03-schema-i-walidacja-runtime.md) - Schema i walidacja runtime; Typy domenowe, Data i branded types; Pattern matching; Services, Context i Layer
- [04-konfiguracja-i-sekrety.md](./references/04-konfiguracja-i-sekrety.md) - Konfiguracja i sekrety; Resource management i Scope; Retry, timeouty i Schedule; Concurrency
- [05-observability.md](./references/05-observability.md) - Observability; Bezpieczeństwo; Frontend i Svelte/SvelteKit; Backend, CLI i workery
- [06-organizacja-projektu.md](./references/06-organizacja-projektu.md) - Organizacja projektu; Czytelność i styl; Integracja z bibliotekami Promise; Integracja z bazą danych
