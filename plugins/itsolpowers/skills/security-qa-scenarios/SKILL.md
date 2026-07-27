---
name: security-qa-scenarios
description: "Security QA scenarios: abuse cases, negative tests, permissions, tenants, repros."
---

# Security QA Scenarios

Generate concrete negative and abuse-case tests from actors, objects, trust boundaries, state, inputs, time, and limits.

## Process

1. Inspect the changed behavior and data flow before listing risks.
2. Check negative paths, bypasses, tenant/object boundaries, logs, cache, async jobs, and release impact where relevant.
3. For review, report findings by severity with file references and concrete exploit or failure scenarios.
4. For implementation, add controls and tests in the backend or trusted boundary; do not rely on frontend-only enforcement.

## Evidence

Prefer code, tests, logs, config, API contracts, and data examples over assumptions.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Security definition of done; Testy bezpieczeństwa w development
- [02-jak-wymyslac-scenariusze-testowe.md](./references/02-jak-wymyslac-scenariusze-testowe.md) - Jak wymyślać scenariusze testowe
- [03-katalog-scenariuszy-qa.md](./references/03-katalog-scenariuszy-qa.md) - Katalog scenariuszy QA; Checklist QA
