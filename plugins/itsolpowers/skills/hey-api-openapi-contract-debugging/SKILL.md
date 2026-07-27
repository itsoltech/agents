---
name: hey-api-openapi-contract-debugging
description: "Debug Hey API generation, OpenAPI drift, stale clients, wrong types, auth, and CI."
---

# Hey API OpenAPI Contract Debugging

Trace failures from OpenAPI input through generator config, output directory, generated types, runtime validation, API usage, and CI diff checks.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Isolate the boundary that fails and compare it with a known working path.
4. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Instalacja i wersjonowanie; Podstawowa konfiguracja; Input specyfikacji
- [02-parser-patch-filters-i-transforms.md](./references/02-parser-patch-filters-i-transforms.md) - Parser, patch, filters i transforms; Plugin TypeScript; Plugin SDK; Klient Fetch
- [03-runtime-validation-i-zod.md](./references/03-runtime-validation-i-zod.md) - Runtime validation i Zod; TanStack Query plugin; Svelte i SvelteKit; Vite plugin
- [04-error-handling.md](./references/04-error-handling.md) - Error handling; Review wygenerowanego kodu; Testy; CI i kontrola kontraktu
