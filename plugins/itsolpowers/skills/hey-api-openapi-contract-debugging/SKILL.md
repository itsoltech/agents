---
name: hey-api-openapi-contract-debugging
description: Use when diagnosing @hey-api/openapi-ts generation failures, stale generated code, contract drift, wrong TypeScript types, broken SDK methods, fetch client bugs, auth mismatch, runtime validation mismatch, TanStack Query integration bugs, or CI openapi:check failures.
---

# Hey API OpenAPI Contract Debugging

Trace failures from OpenAPI input through generator config, output directory, generated types, runtime validation, API usage, and CI diff checks.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
4. Isolate the boundary that fails and compare it with a known working path.
5. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

