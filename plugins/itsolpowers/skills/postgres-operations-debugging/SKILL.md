---
name: postgres-operations-debugging
description: "PostgreSQL debugging: slow queries, locks, CPU/RAM/disk, PgBouncer, replication, HA."
---

# Postgres Operations Debugging

Debug PostgreSQL incidents with evidence from plans, locks, connections, logs, metrics, replication state, vacuum state, and recent migrations before changing settings.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Isolate the boundary that fails and compare it with a known working path.
4. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; EXPLAIN i analiza planów; Statystyki plannerowe; Blokady i współbieżność
- [02-pgbouncer-tryby-pracy.md](./references/02-pgbouncer-tryby-pracy.md) - PgBouncer - tryby pracy; PgBouncer vs direct connection; PgBouncer i prepared statements; PgBouncer i search_path
- [03-pgbouncer-konfiguracja-i-monitoring.md](./references/03-pgbouncer-konfiguracja-i-monitoring.md) - PgBouncer - konfiguracja i monitoring; PgBouncer - edge case'y produkcyjne; Direct connection - kiedy omijać PgBouncer; Backupy
- [04-patroni-i-automatyczny-failover.md](./references/04-patroni-i-automatyczny-failover.md) - Patroni i automatyczny failover; Load balancing; Replikacja logiczna; Sharding i rozproszenie danych
- [05-monitoring.md](./references/05-monitoring.md) - Monitoring; Logowanie
- [06-rozwiazywanie-problemow.md](./references/06-rozwiazywanie-problemow.md) - Rozwiązywanie problemów; Upgrade'y; Kontenery i Nomad
- [Shared operational procedures](../_shared/references/postgres/operational-procedures.md) - wspólne procedury i SQL; w debugowaniu zaczynaj od symptomów i aktualnego stanu
- [Shared minimum application settings](../_shared/references/postgres/minimum-application-settings.md) - wspólne ustawienia i komendy PgBouncer; nie zmieniaj konfiguracji bez dowodu z diagnostyki
