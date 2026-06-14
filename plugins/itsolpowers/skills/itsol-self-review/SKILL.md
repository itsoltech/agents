---
name: itsol-self-review
description: "Self-review before handoff: tests, edge cases, security, UX, performance, risks."
---

# ITSOL Self Review

Run a final review before saying work is complete.

## Process

1. Re-read the diff, not only the files you remember editing.
2. Check requirements, edge cases, permissions, validation, data consistency, errors, logs, and rollout risk.
3. Confirm RED/GREEN evidence for code changes, or explain why a TDD test was not practical and what replaced it.
4. Load focused domain review skills for touched areas.
5. Report verification commands and remaining risks.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.

## Large PR Subagent Review

For large pull requests, you must use subagents before producing the final review. Treat a PR as large when it touches multiple domains, many files, generated plus handwritten code, security-sensitive paths, database behavior, infrastructure, or several independent risk areas.

Split the review by independent surfaces such as UI, API, database, infrastructure, security, generated clients, tests, or performance. Each subagent should inspect one narrow area and return concrete findings with file references, severity, affected behavior, and missing verification. The main agent consolidates those findings, removes duplicates, resolves conflicts, decides the final verdict, and writes the final review summary.
