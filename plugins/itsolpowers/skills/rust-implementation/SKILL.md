---
name: rust-implementation
description: "Rust implementation: ownership, errors, modules, async, SQLx, Serde, tracing, tests."
---

# Rust Implementation

Prefer correct, readable Rust first; optimize only where measurements or requirements justify complexity.

## Process

1. Inspect existing project conventions before introducing new structure.
2. Define the contract, data flow, error behavior, permissions, observability, and tests before editing.
3. Make the smallest coherent change that satisfies the behavior.
4. Run focused verification and use `itsol-self-review` before handoff.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Cel dokumentu; Zasady ogólne; Ownership i borrowing
- [02-obsluga-bledow.md](./references/02-obsluga-bledow.md) - Obsługa błędów; Paniki i unsafe; SQLx i baza danych; Serde, JSON i DTO
- [Shared Rust tooling and boundary guidance](../_shared/references/rust/tooling-clippy-rustfmt-lints.md) - wspólne fakty dla implementacji: Clippy, rustfmt, lints, config, HTTP, jobs, macros i CI
