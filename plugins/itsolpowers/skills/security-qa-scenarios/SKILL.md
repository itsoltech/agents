---
name: security-qa-scenarios
description: "Security QA scenarios: abuse cases, negative tests, permissions, tenants, repros."
---

# Security QA Scenarios

Generate concrete negative and abuse-case tests from actors, objects, trust boundaries, state, inputs, time, and limits.

## Process

1. Inspect the changed behavior and data flow before listing risks.
2. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
3. Check negative paths, bypasses, tenant/object boundaries, logs, cache, async jobs, and release impact where relevant.
4. For review, report findings by severity with file references and concrete exploit or failure scenarios.
5. For implementation, add controls and tests in the backend or trusted boundary; do not rely on frontend-only enforcement.

## Evidence

Prefer code, tests, logs, config, API contracts, and data examples over assumptions.

