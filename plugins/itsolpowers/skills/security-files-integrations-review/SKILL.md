---
name: security-files-integrations-review
description: "Security files/integrations review: uploads, untrusted content, webhooks, SSRF, secrets."
---

# Security Files Integrations Review

Check file trust, storage access, scanning, webhook authenticity, outbound request limits, live event authorization, and integration failure modes.

## Process

1. Inspect the changed behavior and data flow before listing risks.
2. Read [references/guide.md](references/guide.md); it contains the ITSOL security knowledge extracted for this skill.
3. Check negative paths, bypasses, tenant/object boundaries, logs, cache, async jobs, and release impact where relevant.
4. For review, report findings by severity with file references and concrete exploit or failure scenarios.
5. For implementation, add controls and tests in the backend or trusted boundary; do not rely on frontend-only enforcement.

## Large PR Subagent Review

For broad or materially risky pull requests, recommend focused additional review only when independent expertise is likely to improve the verdict. Judge this from concrete risk, novelty, blast radius, reversibility, and context size—not file count or category matching alone. Small and conventional changes should remain one pragmatic pass.

When additional reviewers add value, split only by independent material surfaces. Each returns concrete evidence-based findings; the main agent removes duplicates and false positives and owns the proportional final verdict.

## Evidence

Prefer code, tests, logs, config, API contracts, and data examples over assumptions.

