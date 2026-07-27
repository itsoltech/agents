---
name: rust-debugging
description: "Rust debugging: compiler, borrow/lifetime, async, locks, panics, SQLx, Serde, perf."
---

# Rust Debugging

Debug Rust issues by isolating ownership, concurrency, data mapping, error propagation, and measured hot paths before refactoring.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Isolate the boundary that fails and compare it with a known working path.
4. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Cel dokumentu; Zasady ogólne; Ownership i borrowing
- [02-sqlx-i-baza-danych.md](./references/02-sqlx-i-baza-danych.md) - SQLx i baza danych; Serde, JSON i DTO; Logowanie, tracing i diagnostyka; Testy
- [03-http-api-i-warstwa-zewnetrzna.md](./references/03-http-api-i-warstwa-zewnetrzna.md) - HTTP, API i warstwa zewnętrzna; Kolejki, joby i retry; Minimalny zestaw kontroli w CI
