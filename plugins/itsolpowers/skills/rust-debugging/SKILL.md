---
name: rust-debugging
description: Use when diagnosing Rust compiler errors, borrow or lifetime issues, async deadlocks, lock contention, panics, unsafe behavior, SQLx bugs, Serde mapping errors, tracing gaps, memory or allocation regressions, performance problems, or flaky tests.
---

# Rust Debugging

Debug Rust issues by isolating ownership, concurrency, data mapping, error propagation, and measured hot paths before refactoring.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
4. Isolate the boundary that fails and compare it with a known working path.
5. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.
