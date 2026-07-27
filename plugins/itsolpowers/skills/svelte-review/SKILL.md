---
name: svelte-review
description: "Review Svelte components, routes, stores, forms, security, accessibility, and tests."
---

# Svelte Review

Review Svelte changes for correctness, reactivity, data flow, accessibility, security, async UX, and maintainability.

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

- [01-overview.md](./references/01-overview.md) - Overview; Zasady ogólne; TypeScript; Struktura projektu
- [02-komunikacja-z-api.md](./references/02-komunikacja-z-api.md) - Komunikacja z API; Runtime config i zmienne środowiskowe; Autoryzacja i sesja; Formularze, Superforms i Zod
- [03-csp-i-naglowki-bezpieczenstwa.md](./references/03-csp-i-naglowki-bezpieczenstwa.md) - CSP i nagłówki bezpieczeństwa; CSRF, CORS i cookies; Storage w przeglądarce; API security z perspektywy frontendu
- [04-testy-e2e.md](./references/04-testy-e2e.md) - Testy E2E; Dostępność w testach; Observability i diagnostyka; CI, lint i formatowanie
