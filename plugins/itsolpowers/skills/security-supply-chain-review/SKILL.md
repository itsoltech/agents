---
name: security-supply-chain-review
description: "Security supply chain review: dependencies, lockfiles, scripts, SBOM, licenses, CVEs."
---

# Security Supply Chain Review

Check dependency provenance, lockfiles, generated code, CI gates, artifact integrity, SBOM/provenance, and container scanning.

## Process

1. Inspect the changed behavior and data flow before listing risks.
2. Check negative paths, bypasses, tenant/object boundaries, logs, cache, async jobs, and release impact where relevant.
3. For review, report findings by severity with file references and concrete exploit or failure scenarios.
4. For implementation, add controls and tests in the backend or trusted boundary; do not rely on frontend-only enforcement.

## Large PR Subagent Review

For broad or materially risky pull requests, recommend focused additional review only when independent expertise is likely to improve the verdict. Judge this from concrete risk, novelty, blast radius, reversibility, and context size—not file count or category matching alone. Small and conventional changes should remain one pragmatic pass.

When additional reviewers add value, split only by independent material surfaces. Each returns concrete evidence-based findings; the main agent removes duplicates and false positives and owns the proportional final verdict.

## Evidence

Prefer code, tests, logs, config, API contracts, and data examples over assumptions.

## Focused References

- [01-dependencies-and-ci.md](./references/01-dependencies-and-ci.md) - Dependencies And CI
- [02-release-process-and-tools.md](./references/02-release-process-and-tools.md) - Release Process And Tools
