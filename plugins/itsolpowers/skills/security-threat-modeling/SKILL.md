---
name: security-threat-modeling
description: "Threat modeling: assets, actors, trust boundaries, threats, controls, residual risk."
---

# Security Threat Modeling

Identify assets, actors, trust boundaries, what can go wrong, controls, and tests before implementation or review.

## Process

1. Inspect the changed behavior and data flow before listing risks.
2. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
3. Check negative paths, bypasses, tenant/object boundaries, logs, cache, async jobs, and release impact where relevant.
4. For review, report findings by severity with file references and concrete exploit or failure scenarios.
5. For implementation, add controls and tests in the backend or trusted boundary; do not rely on frontend-only enforcement.

## Evidence

Prefer code, tests, logs, config, API contracts, and data examples over assumptions.

