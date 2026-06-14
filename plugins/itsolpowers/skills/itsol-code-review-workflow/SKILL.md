---
name: itsol-code-review-workflow
description: Use when reviewing ITSOL pull requests at workflow level, checking PR scope, acceptance criteria, risk, reviewer priorities, comment severity, review handoff, large PR decomposition, or final review verdict.
---

# ITSOL Code Review Workflow

Review the PR as a risk-control step: verify behavior, safety, tests, and maintainability before style preferences.

## Process

1. Read the story, acceptance criteria, tech notes, PR description, changed files, tests, risks, migrations, config, and QA notes.
2. Check review priorities in order: scope and acceptance criteria, correctness, security, architecture, data, errors, tests, performance, observability, maintainability, then style.
3. For large PRs, use subagents by independent surface and consolidate findings into one final verdict.
4. Label comments by intent: `Blocker`, `Should`, `Question`, `Suggestion`, `Nit`, or `Note`.
5. Stop review and request a technical discussion when scope, architecture, requirements, migration, rollout, or PR size prevents reliable review.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
