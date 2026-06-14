---
name: security-frontend-browser-review
description: Use when implementing or reviewing frontend code that handles auth state, browser storage, forms, XSS-sensitive rendering, CSP, CORS, CSRF, cache behavior, logout cleanup, API calls, or data visible in the browser.
---

# Security Frontend Browser Review

Check that frontend improves UX but never becomes the security boundary; review XSS, storage, cache, CSRF, CORS, and logout cleanup.

## Process

1. Inspect the changed behavior and data flow before listing risks.
2. Read [references/guide.md](references/guide.md); it contains the ITSOL security knowledge extracted for this skill.
3. Check negative paths, bypasses, tenant/object boundaries, logs, cache, async jobs, and release impact where relevant.
4. For review, report findings by severity with file references and concrete exploit or failure scenarios.
5. For implementation, add controls and tests in the backend or trusted boundary; do not rely on frontend-only enforcement.

## Large PR Subagent Review

For large pull requests, you must use subagents before producing the final review. Treat a PR as large when it touches multiple domains, many files, generated plus handwritten code, security-sensitive paths, database behavior, infrastructure, or several independent risk areas.

Split the review by independent surfaces such as UI, API, database, infrastructure, security, generated clients, tests, or performance. Each subagent should inspect one narrow area and return concrete findings with file references, severity, affected behavior, and missing verification. The main agent consolidates those findings, removes duplicates, resolves conflicts, decides the final verdict, and writes the final review summary.

## Evidence

Prefer code, tests, logs, config, API contracts, and data examples over assumptions.

