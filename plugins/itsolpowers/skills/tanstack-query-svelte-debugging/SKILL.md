---
name: tanstack-query-svelte-debugging
description: "TanStack Query Svelte debugging for v5 and v6: stale data, keys, invalidation, optimistic UI, SSR, stores/runes migration bugs."
---

# TanStack Query Svelte Debugging

Trace cache state from query key to query function to invalidation and rendered UI before changing behavior. Detect the installed TanStack Query Svelte version before applying v5 store-style or v6 runes-style fixes.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
4. Detect `@tanstack/svelte-query` and `svelte` versions, then isolate whether the failure is cache, query key, SSR, store-style v5 usage, or runes-style v6 migration.
5. Isolate the boundary that fails and compare it with a known working path.
6. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.
