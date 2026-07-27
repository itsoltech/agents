---
name: hey-api-openapi-review
description: "Hey API review: OpenAPI specs, generated clients, SDKs, auth, validation, CI."
---

# Hey API OpenAPI Review

Review whether generated client changes reflect a clear API contract, safe config, isolated output, runtime validation needs, security, and CI enforcement.

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

- [01-overview.md](./references/01-overview.md) - Overview; Założenia; Instalacja i wersjonowanie; Struktura katalogów
- [02-openapi-jako-kontrakt.md](./references/02-openapi-jako-kontrakt.md) - OpenAPI jako kontrakt; Jakość schematów danych; Parser, patch, filters i transforms; Plugin TypeScript
- [Shared Fetch client](../_shared/references/hey-api/fetch-client.md) - wspólne fakty; oceń klienta zgodnie z review flow i publicznym kontraktem
- [04-svelte-i-sveltekit.md](./references/04-svelte-i-sveltekit.md) - Svelte i SvelteKit; Multi API, monorepo i wiele outputów; Bezpieczeństwo generowanego klienta; Error handling
- [05-ci-i-kontrola-kontraktu.md](./references/05-ci-i-kontrola-kontraktu.md) - CI i kontrola kontraktu; Migracje kontraktu API; Checklist do code review; Minimalny standard projektu
