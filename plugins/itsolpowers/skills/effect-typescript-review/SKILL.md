---
name: effect-typescript-review
description: "Effect TS review: services, layers, errors, Schema, concurrency, resources, tests."
---

# Effect TypeScript Review

Review whether Effect is clarifying boundaries or hiding complexity, with typed errors, safe dependencies, resource cleanup, and observable failures.

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

- [01-overview.md](./references/01-overview.md) - Overview; Mental model Effect; Granice uruchamiania Effect; Error model
- [02-api-client-i-fetch.md](./references/02-api-client-i-fetch.md) - API client i fetch; Schema i walidacja runtime; Typy domenowe, Data i branded types
- [03-services-context-i-layer.md](./references/03-services-context-i-layer.md) - Services, Context i Layer; Layer composition; Konfiguracja i sekrety; Resource management i Scope
- [04-concurrency.md](./references/04-concurrency.md) - Concurrency; Fibers i lifecycle; Queue, PubSub i backpressure; Cache i batching
- [05-testowanie.md](./references/05-testowanie.md) - Testowanie; Wydajność; Organizacja projektu; Czytelność i styl
- [06-minimalny-zestaw-kontroli-w-ci.md](./references/06-minimalny-zestaw-kontroli-w-ci.md) - Minimalny zestaw kontroli w CI; Checklist skrócony do code review
