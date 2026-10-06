---
name: rust-debugging
description: "Diagnose Rust failures involving ownership, async, locks, panics, errors, SQLx, Serde, or performance."
---

# Rust Debugging

Debug Rust issues by isolating ownership, concurrency, data mapping, error propagation, and measured hot paths before refactoring.

## Trigger boundary

Use this skill when a Rust symptom may involve ownership/lifetimes, async or locks, panics, error propagation, SQLx/Serde boundaries, unsafe code, or measured performance.

Do not load it for a small local edit with a deterministic cause and no runtime, data, concurrency, or performance behavior change; follow the repository's established convention directly.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Cel dokumentu; Zasady ogólne; Ownership i borrowing
- [02-sqlx-i-baza-danych.md](./references/02-sqlx-i-baza-danych.md) - SQLx i baza danych; Serde, JSON i DTO; Logowanie, tracing i diagnostyka; Testy
- [03-http-api-i-warstwa-zewnetrzna.md](./references/03-http-api-i-warstwa-zewnetrzna.md) - HTTP, API i warstwa zewnętrzna; Kolejki, joby i retry; Minimalny zestaw kontroli w CI
