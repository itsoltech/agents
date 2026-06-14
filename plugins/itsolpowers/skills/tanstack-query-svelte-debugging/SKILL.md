---
name: tanstack-query-svelte-debugging
description: Use when diagnosing stale data, missing refetches, duplicate requests, wrong query keys, disabled queries, failed invalidation, optimistic update bugs, SSR hydration issues, logout cache leaks, or TanStack Query performance problems in Svelte.
---

# TanStack Query Svelte Debugging

Trace cache state from query key to query function to invalidation and rendered UI before changing behavior.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
4. Isolate the boundary that fails and compare it with a known working path.
5. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

