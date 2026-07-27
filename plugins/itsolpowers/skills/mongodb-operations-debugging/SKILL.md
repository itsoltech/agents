---
name: mongodb-operations-debugging
description: "MongoDB debugging: slow queries, indexes, aggregation, replication, sharding, backups."
---

# MongoDB Operations Debugging

Debug MongoDB incidents using explain output, index state, profiler or slow query data, replication metrics, shard state, driver config, and recent schema/index changes.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Isolate the boundary that fails and compare it with a known working path.
4. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Query optimization; Aggregation pipeline; Connection pooling i konfiguracja drivera
- [02-replication-lag.md](./references/02-replication-lag.md) - Replication lag; Sharding; Shard key; Balancer, chunks i operacje sharded cluster
- [03-observability-i-monitoring.md](./references/03-observability-i-monitoring.md) - Observability i monitoring; Slow query workflow; Storage, system operacyjny i self-managed deployment; Kontenery i MongoDB
- [04-importy-eksporty-i-bulk-operations.md](./references/04-importy-eksporty-i-bulk-operations.md) - Importy, eksporty i bulk operations; Dane tymczasowe, TTL i retencja; Time series collections; Change streams
