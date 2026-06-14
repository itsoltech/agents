---
name: security-authz-tenant-review
description: Use when implementing or reviewing authorization, RBAC, ABAC, tenant isolation, object-level permissions, admin operations, workflow permissions, role changes, ownership checks, or access to another user or organization data.
---

# Security Authz Tenant Review

Check object-level authorization, tenant context, role assumptions, workflow state, negative tests, and bypass paths.

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

