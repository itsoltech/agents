---
name: hey-api-openapi-codegen
description: "Hey API codegen: OpenAPI TS clients, SDK, fetch, Zod, TanStack Query, SvelteKit, CI."
---

# Hey API OpenAPI Codegen

Treat OpenAPI as the contract and generated code as an artifact; keep config versioned, output isolated, and contract checks in CI.

## Process

1. Inspect existing project conventions before introducing new structure.
2. Define the contract, data flow, error behavior, permissions, observability, and tests before editing.
3. Make the smallest coherent change that satisfies the behavior.
4. Run focused verification and use `itsol-self-review` before handoff.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Cel dokumentu; Założenia; Instalacja i wersjonowanie
- [02-output-i-wygenerowane-pliki.md](./references/02-output-i-wygenerowane-pliki.md) - Output i wygenerowane pliki; OpenAPI jako kontrakt; Jakość schematów danych; Parser, patch, filters i transforms
- [Shared Fetch client](../_shared/references/hey-api/fetch-client.md) - wspólne fakty dla codegen: auth, komunikacja, runtime validation, Zod i TanStack Query
- [04-svelte-i-sveltekit.md](./references/04-svelte-i-sveltekit.md) - Svelte i SvelteKit; Vite plugin; Multi API, monorepo i wiele outputów; Bezpieczeństwo generowanego klienta
- [05-testy.md](./references/05-testy.md) - Testy; CI i kontrola kontraktu; Migracje kontraktu API; Publikacja wygenerowanego klienta jako paczki
