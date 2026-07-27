---
name: mongodb-review
description: "MongoDB review: schemas, queries, indexes, aggregation, transactions, security, tests."
---

# MongoDB Review

Review MongoDB changes for access-pattern fit, index coverage, consistency, concurrency, tenant isolation, operational impact, and data lifecycle safety.

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

- [01-overview.md](./references/01-overview.md) - Overview; Cel dokumentu; Zasady ogólne; Kiedy MongoDB pasuje do problemu
- [02-projektowanie-modelu-danych.md](./references/02-projektowanie-modelu-danych.md) - Projektowanie modelu danych; Embedding vs references; Rozmiar dokumentu i zagnieżdżenia; Nazewnictwo i konwencje schematu
- [03-indeksy.md](./references/03-indeksy.md) - Indeksy; Query optimization; Paginacja
- [04-aggregation-pipeline.md](./references/04-aggregation-pipeline.md) - Aggregation pipeline; Update, upsert i atomicity; Transakcje; Idempotencja i retry
- [05-connection-pooling-i-konfiguracja-drivera.md](./references/05-connection-pooling-i-konfiguracja-drivera.md) - Connection pooling i konfiguracja drivera; Read concern, write concern i read preference; Replica set; Sharding
- [06-sekrety-i-connection-stringi.md](./references/06-sekrety-i-connection-stringi.md) - Sekrety i connection stringi; Observability i monitoring; Index builds i zmiany indeksów; Importy, eksporty i bulk operations
- [07-aplikacyjny-repository-data-access-layer.md](./references/07-aplikacyjny-repository-data-access-layer.md) - Aplikacyjny repository/data access layer; Komunikacja API i persistence; Testowanie aplikacji z MongoDB; Scenariusze QA i edge case'y
- [08-checklist-do-code-review.md](./references/08-checklist-do-code-review.md) - Checklist do code review; Minimalny standard dla nowej kolekcji
