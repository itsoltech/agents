---
name: hey-api-openapi-codegen
description: Use when configuring or implementing @hey-api/openapi-ts, OpenAPI TypeScript generation, generated clients, SDK output, fetch client, Zod runtime validation, TanStack Query plugin, SvelteKit integration, Vite plugin, monorepo outputs, or CI contract checks.
---

# Hey API OpenAPI Codegen

Treat OpenAPI as the contract and generated code as an artifact; keep config versioned, output isolated, and contract checks in CI.

## Process

1. Inspect existing project conventions before introducing new structure.
2. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
3. Define the contract, data flow, error behavior, permissions, observability, and tests before editing.
4. Make the smallest coherent change that satisfies the behavior.
5. Run focused verification and use `itsol-self-review` before handoff.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

