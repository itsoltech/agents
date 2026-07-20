---
name: dotnet-web-api-review
description: ".NET API review: architecture, validation, auth, EF Core, jobs, deployment, tests."
---

# Dotnet Web API Review

Review API changes for proportional architecture, contract clarity, validation, security, data consistency, async behavior, observability, and test coverage.

## Process

1. Inspect the diff and surrounding code before applying checklist items.
2. Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files, then read only relevant sector files.
3. Check correctness, boundaries, security, data flow, observability, tests, and deployment impact for the changed behavior.
4. Report concrete findings first, ordered by severity, with file references and affected behavior.
5. Call out missing tests or residual risk only when it is tied to the reviewed change.

## Large PR Subagent Review

For broad or materially risky pull requests, recommend focused additional review only when independent expertise is likely to improve the verdict. Judge this from concrete risk, novelty, blast radius, reversibility, and context size—not file count or category matching alone. Small and conventional changes should remain one pragmatic pass.

When additional reviewers add value, split only by independent material surfaces. Each returns concrete evidence-based findings; the main agent removes duplicates and false positives and owns the proportional final verdict.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

