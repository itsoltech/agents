---
name: postgres-review
description: "Review PostgreSQL schemas, migrations, queries, indexes, RLS, pooling, and backups."
---

# Postgres Review

Review database changes for integrity, plan quality, migration safety, concurrency, tenant isolation, operational impact, and rollback or roll-forward readiness.

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

- [01-overview.md](./references/01-overview.md) - Overview; Cel dokumentu; Zasady ogólne; Warstwy odpowiedzialności
- [Shared JSONB and query design](../_shared/references/postgres/jsonb.md) - wspólne fakty; użyj ich jako review rubryku dla JSONB, partycjonowania, indeksów, zapytań i EXPLAIN
- [Shared planner statistics and concurrency](../_shared/references/postgres/planner-statistics.md) - wspólne fakty; użyj ich jako review rubryku dla statystyk, transakcji, blokad i capacity
- [04-connection-pooling.md](./references/04-connection-pooling.md) - Connection pooling; PgBouncer - tryby pracy; PgBouncer vs direct connection; PgBouncer i prepared statements
- [05-pgbouncer-konfiguracja-i-monitoring.md](./references/05-pgbouncer-konfiguracja-i-monitoring.md) - PgBouncer - konfiguracja i monitoring; PgBouncer - edge case'y produkcyjne; Migracje schematu; Migracje danych
- [06-point-in-time-recovery.md](./references/06-point-in-time-recovery.md) - Point-in-time recovery; Replikacja fizyczna i HA; Load balancing; Bezpieczeństwo
- [07-monitoring.md](./references/07-monitoring.md) - Monitoring; Logowanie; Testy i QA; Scenariusze testowe dla edge case'ów
- [Shared operational procedures](../_shared/references/postgres/operational-procedures.md) - wspólne procedury i SQL; oceniaj konkretne ryzyko rollout/incident/rollback
- [Shared minimum application settings](../_shared/references/postgres/minimum-application-settings.md) - wspólne ustawienia i komendy PgBouncer; traktuj jako rubryk, nie automatyczny nakaz zmiany
- [10-checklist-do-code-review.md](./references/10-checklist-do-code-review.md) - Checklist do code review
