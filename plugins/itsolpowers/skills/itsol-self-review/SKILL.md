---
name: itsol-self-review
description: "Self-review before handoff: plans, tests, edge cases, security, UX, risks."
---

# ITSOL Self Review

Run a final review before saying work is complete. Also use this skill as the read-only Rubber Duck reviewer for Business Plan and Technical Plan artifacts before approval.

## Process

1. Re-read the artifact under review: plan file, diff, PR, patch, migration, deployment config, or generated artifact.
2. For plans, act as a critical teammate looking for holes: challenge scope, assumptions, edge cases, approvals, missing files, missing skills, tests, rollout, rollback, and verification.
3. For code changes, check requirements, edge cases, permissions, validation, data consistency, errors, logs, and rollout risk.
4. Confirm RED/GREEN evidence for code changes, or explain why a TDD test was not practical and what replaced it.
5. Load focused domain review skills for touched areas.
6. Report blockers, important gaps, non-blocking suggestions, verification commands, and remaining risks.

## Rubber Duck Plan Review

When reviewing a Business Plan or Technical Plan, do not edit the file. Return a critical report with:

1. Plan inspected and related context used.
2. Blockers that make the plan not ready for approval.
3. Important gaps, hidden assumptions, weak acceptance criteria, missing technical decisions, or missing verification.
4. Questions the main agent must ask the user before approval.
5. Plan sections that need updates.
6. Verdict: `ready for approval` or `not ready for approval`.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.

## Large PR Subagent Review

For large pull requests, you must use subagents before producing the final review. Treat a PR as large when it touches multiple domains, many files, generated plus handwritten code, security-sensitive paths, database behavior, infrastructure, or several independent risk areas.

Split the review by independent surfaces such as UI, API, database, infrastructure, security, generated clients, tests, or performance. Each subagent should inspect one narrow area and return concrete findings with file references, severity, affected behavior, and missing verification. The main agent consolidates those findings, removes duplicates, resolves conflicts, decides the final verdict, and writes the final review summary.
