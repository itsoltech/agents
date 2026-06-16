# Planning Gates

Use this reference when a user asks to build, modify, add, remove, or change application behavior.

## Hard Gate

For functional tasks, do not edit production code, tests, configs, migrations, or generated clients until all conditions are true:

- the Discovery Gate is complete for vague, one-sentence, broad, or underspecified requests
- the Business Plan markdown file exists in the repo
- the Business Plan passed Plan Self-Review
- the Business Plan passed Rubber Duck Plan Review by a subagent and all material findings are resolved
- the user approved the Business Plan file
- `.itsol.md` repo or project policy was read when present and relevant
- the Technical Decision Gate is complete before the Technical Plan is written, including user confirmation when there is only one viable technical path
- the Technical Plan markdown file exists in the repo
- the Technical Plan passed Plan Self-Review
- the Technical Plan passed Rubber Duck Plan Review by a subagent and all material findings are resolved
- the user approved the Technical Plan file
- the user chose execution mode: subagents or inline

If the user asks to skip planning, still produce the shortest useful version of both plans and ask for approval.

Do not write a Business Plan directly from a vague request. A short user brief is only a starting signal for discovery, not permission to choose product behavior, scope, architecture, or rollout strategy on the user's behalf.

## Approval Gate

Plan approval must be explicit, separate, and informed. A plan is not approved just because the user asked the agent to fix, implement, continue, prepare a plan, or proceed with the task.

Valid approval requires all of these conditions:

1. The plan file was written with `**Status:** Draft`.
2. The agent presented the plan path and a concise summary of the plan to the user.
3. The agent asked for approval using a direct question.
4. The user replied after that question with an explicit approval such as `approve`, `approved`, `akceptuję`, `zatwierdzam`, `ok, wdrażaj`, or equivalent.

Invalid approval examples:

- `Approved by direct user request`
- `Approved because user asked to implement`
- `Approved because user said continue` before seeing the plan
- approval inferred from the original task request
- approval inferred from silence, lack of objections, or a previous unrelated approval

Only after valid approval may the agent update the plan status to `Approved`. If approval is missing or ambiguous, keep `**Status:** Draft`, stop, and ask the user to approve or request changes. Do not start implementation while any required plan status is `Draft`.

## Plan Files

Persist planning artifacts in the target repository, similar to how Superpowers saves specs and implementation plans before execution.

Default location:

- Business Plan: `.itsol/plans/YYYY-MM-DD-<task-slug>-business.md`
- Technical Plan: `.itsol/plans/YYYY-MM-DD-<task-slug>-technical.md`

Use a different location only when the repo already has a clear planning convention or the user requests one. Do not use plugin source documentation folders or external best-practices source directories as the default destination.

Before writing:

1. Inspect existing repo conventions for planning docs.
2. Create the destination directory if missing.
3. Use the current date and a short lowercase slug from the task.
4. Keep both plan files under version control unless the user says planning artifacts should stay local.
5. After each file is written, run the Plan Self-Review and fix placeholders, contradictions, missing sections, vague acceptance criteria, TODOs, unresolved questions, and verification gaps.
6. After self-review fixes, run the Rubber Duck Plan Review with a separate subagent before asking for approval.
7. New plan files must start with `**Status:** Draft`. Do not write `Approved` in a new plan file.

## Scope Gate

Before interviewing in detail, decide whether the request is small enough for one coherent Business Plan and one Technical Plan.

Treat the request as too broad when it includes:

- several independent products, workflows, modules, or user journeys
- unrelated UI, API, data, infrastructure, and integration changes with separate rollout risks
- unclear acceptance criteria across multiple stakeholder goals
- migrations plus large feature work plus operational changes in one request
- more task slices than can be reviewed and validated as one safe release

When the request is too broad:

1. Explain the risk concretely: broad plans create weak acceptance criteria, missed edge cases, conflicting implementation work, and unreliable verification.
2. Propose a smaller first scope that can be implemented, reviewed, deployed, and validated independently.
3. Name the deferred follow-up scopes explicitly.
4. Ask the user to approve the smaller first scope before continuing the interview.
5. Plan follow-up changes only after the first plan is implemented and validated, unless the user explicitly asks for a roadmap document rather than an implementation plan.

Do not bury multiple independent projects inside one Technical Plan. A good first plan should produce a useful, testable increment on its own.

## Execution Mode Question

After both plans are approved, ask:

`How should I execute this: subagent-driven or inline?`

Recommend subagents when the task has independent surfaces, such as UI/API/database/security/infra, several files with separate ownership, or parallel review/debugging paths. Recommend inline for tiny single-surface changes where subagent coordination would add overhead.

Do not start implementation until the user answers or explicitly instructs a default. If the user asks for your recommendation, choose subagent-driven for medium or larger functional work and inline for very small single-file changes.

When the user chooses subagent-driven execution, load `itsol-subagent-workflow` before implementation. That workflow owns task splitting, concurrency, implementation delegation, independent review loops, per-task commits, final validation, and the final user summary.
