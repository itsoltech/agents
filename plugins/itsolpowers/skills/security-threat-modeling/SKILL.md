---
name: security-threat-modeling
description: "Threat modeling: assets, actors, trust boundaries, threats, controls, residual risk."
---

# Security Threat Modeling

Identify assets, actors, trust boundaries, what can go wrong, controls, and tests before implementation or review.

## Process

1. Inspect the changed behavior and data flow before listing risks.
2. Check negative paths, bypasses, tenant/object boundaries, logs, cache, async jobs, and release impact where relevant.
3. For review, report findings by severity with file references and concrete exploit or failure scenarios.
4. For implementation, add controls and tests in the backend or trusted boundary; do not rely on frontend-only enforcement.

## Evidence

Prefer code, tests, logs, config, API contracts, and data examples over assumptions.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Cel dokumentu; Standardy odniesienia; Zasady pracy
- [02-security-review-pull-requestu.md](./references/02-security-review-pull-requestu.md) - Security review pull requestu; Integracja z innymi dokumentami zespołu; Role i odpowiedzialności; Checklist code review
