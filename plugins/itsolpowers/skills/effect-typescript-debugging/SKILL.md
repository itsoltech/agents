---
name: effect-typescript-debugging
description: "Effect TS debugging: Schema, Layer, fibers, typed errors, retries, streams, resources."
---

# Effect TypeScript Debugging

Trace Effect failures through Cause, Exit, requirements, layer composition, runtime boundaries, concurrency, and resource scope before patching symptoms.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Isolate the boundary that fails and compare it with a known working path.
4. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Granice uruchamiania Effect; Error model; Cause, Exit i diagnostyka błędów
- [02-schema-i-walidacja-runtime.md](./references/02-schema-i-walidacja-runtime.md) - Schema i walidacja runtime; Services, Context i Layer; Layer composition; Konfiguracja i sekrety
- [03-resource-management-i-scope.md](./references/03-resource-management-i-scope.md) - Resource management i Scope; Retry, timeouty i Schedule; Concurrency; Fibers i lifecycle
- [04-frontend-i-svelte-sveltekit.md](./references/04-frontend-i-svelte-sveltekit.md) - Frontend i Svelte/SvelteKit; Backend, CLI i workery; Testowanie; Wydajność
