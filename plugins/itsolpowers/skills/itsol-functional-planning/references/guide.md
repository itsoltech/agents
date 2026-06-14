# ITSOL Functional Planning Reference

Use this reference when a user asks to build, modify, add, remove, or change application behavior.

## Hard Gate

For functional tasks, do not edit production code, tests, configs, migrations, or generated clients until all three conditions are true:

- the user approved the Business Plan
- the user approved the Technical Plan
- the user chose execution mode: subagents or inline

If the user asks to skip planning, still produce the shortest useful version of both plans and ask for approval.

## Clarification First

Before writing plans, inspect the existing code and ask only questions that change the plan. Clarify:

- who the change is for
- what behavior changes from the user's perspective
- what is explicitly out of scope
- permissions, roles, tenant boundaries, and data ownership
- edge cases and negative paths
- rollout, migration, and compatibility constraints
- what QA should verify

If a detail can be inferred safely from existing code or established patterns, state it as an assumption in the plan instead of asking.

## Business Plan

The Business Plan must be understandable without reading code. Include:

- goal and user-visible outcome
- in-scope behavior
- out-of-scope behavior
- acceptance criteria
- business rules and edge cases
- affected roles, permissions, tenants, or data ownership
- QA notes and manual scenarios when relevant
- assumptions and open questions

End with an explicit approval request:

`Approve the Business Plan before I prepare the Technical Plan.`

## Technical Plan

The Technical Plan must be implementation-ready. Include:

- files, modules, or bounded areas to inspect or modify
- data model, API, UI, cache, job, integration, or infrastructure impact
- concrete logical rules and branches, including important `if` conditions
- TDD plan: RED test or diagnostic, expected failure, GREEN scope, refactor checkpoint
- verification commands and expected scope
- subagent split candidates when surfaces are independent
- risks and rollback notes when relevant

End with an explicit approval request:

`Approve the Technical Plan before I start implementation.`

## Execution Mode Question

After both plans are approved, ask:

`How should I execute this: subagent-driven or inline?`

Recommend subagents when the task has independent surfaces, such as UI/API/database/security/infra, several files with separate ownership, or parallel review/debugging paths. Recommend inline for tiny single-surface changes where subagent coordination would add overhead.

Do not start implementation until the user answers or explicitly instructs a default. If the user asks for your recommendation, choose subagent-driven for medium or larger functional work and inline for very small single-file changes.

When the user chooses subagent-driven execution, load `itsol-subagent-workflow` before implementation. That workflow owns task splitting, concurrency, implementation delegation, independent review loops, per-task commits, final validation, and the final user summary.
