---
name: security-threat-modeling
description: "Threat-model new or changed assets, actors, data flows, integrations, trust boundaries, or controls."
---

# Security Threat Modeling

Identify assets, actors, trust boundaries, what can go wrong, controls, and tests before implementation or review.

## Trigger boundary

Use this skill when a new or materially changed system, data flow, actor, asset, integration, trust boundary, abuse path, control, or residual-risk decision needs security modeling.

Do not load it for a small local rename, comment, formatting change, or mechanical edit with no asset, actor, trust-boundary, data-flow, abuse, or control impact; follow the repository's established convention directly.

## Evidence

Prefer code, tests, logs, config, API contracts, and data examples over assumptions.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Cel dokumentu; Standardy odniesienia; Zasady pracy
- [02-security-review-pull-requestu.md](./references/02-security-review-pull-requestu.md) - Security review pull requestu; Integracja z innymi dokumentami zespołu; Role i odpowiedzialności; Checklist code review
