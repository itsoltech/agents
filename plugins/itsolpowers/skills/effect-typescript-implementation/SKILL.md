---
name: effect-typescript-implementation
description: Use when implementing TypeScript code with Effect, Effect.gen, pipe, Schema, typed errors, services, Context, Layer, retry, timeout, concurrency, resource management, streams, backend workers, frontend boundaries, or tests.
---

# Effect TypeScript Implementation

Use Effect to make failures, dependencies, resources, concurrency, and runtime validation explicit at system boundaries.

## Process

1. Inspect existing project conventions before introducing new structure.
2. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
3. Define the contract, data flow, error behavior, permissions, observability, and tests before editing.
4. Make the smallest coherent change that satisfies the behavior.
5. Run focused verification and use `itsol-self-review` before handoff.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

