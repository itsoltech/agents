---
name: itsol-code-review-workflow
description: Use when reviewing ITSOL pull requests at workflow level, checking PR scope, acceptance criteria, risk, reviewer priorities, comment severity, review handoff, large PR decomposition, or final review verdict.
---

# ITSOL Code Review Workflow

Review the PR as a risk-control step: verify behavior, safety, tests, and maintainability before style preferences.

## Process

1. Read the story, acceptance criteria, tech notes, PR description, changed files, RED/GREEN evidence, tests, risks, migrations, config, and QA notes.
2. Build a review coverage map before reading deeply: functional scope, changed system surfaces, security/trust boundaries, data/storage, infrastructure/deployment, tests/TDD evidence, performance, observability, maintainability, and release/QA risk.
3. Check review priorities in order: scope and acceptance criteria, correctness, security, architecture, data, errors, TDD/test evidence, performance, observability, maintainability, then style.
4. Every code review must cover the relevant areas from the coverage map. For tiny single-surface diffs, an inline review is allowed only when the final response states why subagents were unnecessary and which areas were checked.
5. For large, cross-cutting, multi-surface, security-sensitive, data-sensitive, infrastructure/deployment, migration/rewrite, generated-client/API-contract, or hard-to-fit-in-one-context PRs, subagents are mandatory. Do not perform an inline-only review of one sector.
6. Delegate focused review subagents by changed surface and risk dimension, for example security, infrastructure, frontend, backend, database, generated API clients, migration/rewrite, QA/release, performance, or test strategy. Use the narrowest ITSOL skill/subagent that matches each area.
7. Consolidate subagent findings into one final verdict: deduplicate, order by severity, keep evidence and file references, call out coverage gaps, and distinguish blockers from suggestions.
8. Label comments by intent: `Blocker`, `Should`, `Question`, `Suggestion`, `Nit`, or `Note`.
9. Stop review and request a technical discussion when scope, architecture, requirements, migration, rollout, or PR size prevents reliable review.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
