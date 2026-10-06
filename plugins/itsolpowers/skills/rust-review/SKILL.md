---
name: rust-review
description: "Review Rust changes to ownership, APIs, async, unsafe code, errors, persistence, or behavior tests."
---

# Rust Review

Review Rust changes for correctness, clear ownership, controlled allocation, async safety, error model, maintainable APIs, and measured performance claims.

## Trigger boundary

Use this skill when a Rust diff changes ownership/lifetimes, public APIs, async or locks, unsafe code, errors, SQLx/Serde boundaries, tests, or performance claims.

Do not load it for a small local rename, comment, formatting change, or mechanical edit with no Rust runtime, data, concurrency, safety, or performance impact; follow the repository's established convention directly.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Cel dokumentu; Zasady ogólne; Ownership i borrowing
- [02-sqlx-i-baza-danych.md](./references/02-sqlx-i-baza-danych.md) - SQLx i baza danych; Serde, JSON i DTO; Logowanie, tracing i diagnostyka; Organizacja kodu
- [Shared Rust tooling and boundary guidance](../_shared/references/rust/tooling-clippy-rustfmt-lints.md) - wspólne fakty; użyj ich jako review rubryku dla lints, config, HTTP, jobs, macros i CI
- [04-checklist-skrocony-do-code-review.md](./references/04-checklist-skrocony-do-code-review.md) - Checklist skrócony do code review
