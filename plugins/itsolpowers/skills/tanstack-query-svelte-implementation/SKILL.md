---
name: tanstack-query-svelte-implementation
description: "TanStack Query Svelte implementation for v5 and v6: version detection, runes migration, keys, SSR, mutations, invalidation, errors."
---

# TanStack Query Svelte Implementation

Model server state explicitly: stable keys, version-aware Svelte reactivity, safe cache invalidation, cancellation, typed API errors, and SSR-aware hydration.

## Process

1. Inspect existing project conventions before introducing new structure.
2. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
3. Detect `@tanstack/svelte-query` and `svelte` versions from `package.json` and lockfiles before choosing v5 or v6 patterns.
4. Define the contract, data flow, error behavior, permissions, observability, and tests before editing.
5. Make the smallest coherent change that satisfies the behavior.
6. Run focused verification and use `itsol-self-review` before handoff.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.
