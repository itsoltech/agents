# Planning And Delegation

Use this reference to execute approved work with multiple agents without losing integration control.

## Preconditions

Do not start subagent execution until all are true:

- the Business Plan is approved
- the Technical Plan is approved
- both plan file paths are known
- both plan files contain `**Status:** Approved`
- approval happened after the user saw each specific plan and explicitly approved it
- the user chose subagent-driven execution
- the main agent understands the current git state and existing user changes

If any condition is missing, stop and ask for the missing approval or execution decision.

Invalid approval sources include "direct user request", the original task request, `continue`, silence, or a generic main-agent statement. If approval evidence is ambiguous, stop and ask the user to approve the specific plan before delegation.

## Main Agent Responsibilities

The main agent owns orchestration end to end. Subagents provide bounded execution, review, research, or rubber-duck feedback; they do not own the run.

The main agent must:

- keep the approved Business Plan and Technical Plan as source of truth
- choose whether subagents are justified for the current work
- create and maintain the task graph, queue, statuses, dependencies, and concurrency limit
- issue each task packet and enforce read/write boundaries
- keep integration decisions, shared contracts, cross-task conflict resolution, and final validation
- validate every subagent response before acting on it
- resolve conflicting subagent claims through source inspection, tests, deterministic checks, or user escalation
- decide whether `partial`, `blocked`, or `failed` outcomes need more context, a revised split, user input, or a stopped run
- preserve unrelated user changes and prevent scope expansion

Use inline execution instead of subagents when the task is tiny, sequential, single-file, tightly coupled to shared context, or dominated by one decision owner.

## Task Graph

Represent delegated work as a dependency-aware task graph before launching implementation subagents.

Each node should have:

- stable task id and short name
- task type: implementation, review, research, rubber-duck, verification, or integration
- dependencies and tasks it may unblock
- owned write scope or explicit read-only scope
- current status
- assigned subagent or planned skill coverage
- required verification or evidence
- known risks, assumptions, and open questions

Use these statuses consistently:

- `planned`: defined but not ready to start
- `queued`: ready and waiting for the concurrency limit
- `active`: assigned and in progress
- `reviewing`: implementation is complete enough for independent review
- `changes-requested`: review found actionable issues
- `completed`: task packet was satisfied with evidence
- `partial`: some useful work or evidence returned, but the task packet is not fully satisfied
- `blocked`: the task cannot proceed without missing context, permission, source of truth, dependency, or user/main-agent decision
- `failed`: the task attempted execution but produced unusable output or broke its constraints
- `deferred`: known work was intentionally postponed by the user or recorded as follow-up

Do not mark a task `completed` only because a subagent returned text. Completion requires the response contract, evidence, and verification expectations to be satisfied or explicitly waived by the main agent with reason.

## Task Split

Split the Technical Plan into task slices that can be owned independently:

- one UI flow, route, component group, or form path
- one API endpoint, service, handler, or validation path
- one data model, migration, query, repository, or cache path
- one integration, job, generated-client, or infrastructure path
- one focused test or diagnostic slice when it unblocks implementation

Prefer smaller tasks when write ownership, risk, or verification is unclear. Merge or serialize tasks when they need the same files, change the same shared contract, or require the same local context to make safe decisions.

## Task Packet

Every delegated task must receive a task packet. The packet is the subagent's operating contract.

Include:

- goal and acceptance criteria
- source of truth: approved plan paths, issue/request excerpt, design, API contract, schema, or files to inspect
- context: relevant constraints, assumptions already approved, and dependency status
- read scope: files, directories, logs, PRs, docs, or commands the subagent may inspect
- write scope: files or bounded areas the subagent may edit, or `read-only`
- forbidden scope: files, areas, behaviors, side effects, or refactors the subagent must not touch
- required ITSOL skills from the Technical Plan, plus any narrower review skills discovered during execution
- RED/GREEN expectation from `itsol-tdd-workflow` when code changes
- verification command or evidence expected from the subagent, including replacement verification for documentation-only or non-TDD work
- expected artifacts: changed files, notes, command output summary, screenshots, generated files, or recommended split
- response contract and allowed statuses
- budget or time/complexity limit when useful
- stop conditions and escalation triggers

For code changes, the packet must say whether tests are expected, which focused command proves RED/GREEN, and which wider command should run before handoff. For documentation, planning, or configuration-only work, state the TDD exception and replacement verification before editing.

## Write Ownership

Use one writer for each file, directory slice, migration, generated artifact, or shared semantic contract at a time.

Ownership rules:

- no two active implementation tasks may edit the same file
- no two active implementation tasks may independently change the same API, schema, auth rule, data contract, prompt contract, or public behavior
- a review, research, or rubber-duck task is read-only unless the task packet explicitly grants write scope
- generated files and their source definitions should be owned by the same task unless the Technical Plan says otherwise
- if a task needs a file outside its write scope, it must stop and ask the main agent for a revised packet
- if two tasks need the same write surface, serialize them or make one task read-only analysis
- if existing user changes overlap the task, work with them only when they are inside scope and understandable; otherwise escalate

Shared contracts can conflict semantically even when files differ. Treat API request/response shape, data model meaning, authz decisions, environment variables, generated-client assumptions, prompt contracts, and user-facing workflow as shared ownership surfaces.

## Stop Conditions

A subagent must stop and return `blocked` or `partial` instead of expanding scope when it hits a stop condition.

Stop conditions include:

- missing or ambiguous plan approval, execution mode, or task packet ownership
- required source of truth is unavailable or contradicts the packet
- the task requires a business, architecture, security, data-contract, rollout, or destructive-side-effect decision
- write access is needed outside the packet
- another active task or user change owns the same file or semantic contract
- verification cannot run and no replacement evidence is possible
- the task is too broad for the assigned scope or budget
- the subagent would need nested delegation, `codex exec`, `claude`, or another external agent CLI
- credentials, secrets, production data, or unsafe commands would be required
- results conflict with another subagent or with the source of truth

When blocked, the subagent should return the exact blocker, evidence, recommended split or decision, and what can safely continue. The main agent decides whether to supply context, rewrite the packet, ask the user, serialize tasks, or stop the run.

## Response Contract

Every subagent response must be structured enough for the main agent to validate. Require:

- status: `completed`, `partial`, `blocked`, or `failed` at minimum
- task id and task name
- changed files, or `none` for read-only work
- summary of work performed
- verification run: commands/evidence and result, or why it was not run
- RED/GREEN evidence for code changes, or documented TDD exception and replacement verification
- assumptions made and whether each stayed inside approved scope
- unverified items and coverage gaps
- risks, follow-ups, or deferred findings
- blockers or decisions needed from the main agent/user
- recommended next review target when implementation changed files

Keep integration decisions, shared contracts, cross-task conflict resolution, and final validation in the main agent.

## Parallelism

Before launching implementation subagents, set a concurrency limit.

Use this decision rule:

- 1 concurrent task for high-conflict files, migrations, shared contracts, auth, security-sensitive behavior, or unclear requirements
- 2 concurrent tasks for moderate changes with separate file ownership but shared integration points
- 3 concurrent tasks for clearly independent UI/API/database/infrastructure surfaces
- more than 3 only when the user explicitly approves and the repository surfaces are strongly independent

State the proposed limit to the user or apply the limit already approved in the Technical Plan. Do not exceed the agreed limit. When a task finishes, start the next queued task only if doing so will not conflict with active work.

## Implementation Delegation

For each implementation subagent:

- use the matching ITSOL skill subagent when available
- give a narrow task, owned files, and forbidden areas
- tell it to follow TDD for code changes
- require it to preserve unrelated user changes
- require it to report verification evidence
- require it to use the response contract and status vocabulary
- prohibit broad refactors not present in the approved Technical Plan

The main agent must not delegate the current blocker, approval decisions, or final integration responsibility.

## Delegation Depth

Use one delegation layer only.

- The main agent may spawn implementation, review, research, or rubber-duck subagents.
- A delegated subagent must do its assigned work directly and return a report.
- A delegated subagent must not spawn another subagent, invoke `codex exec`, invoke `claude`, or use another agent CLI to continue the work.
- If the delegated task is too broad, the subagent must return a proposed split, recommended agents/skills, and unresolved questions to the main agent.

## Codex Subagent Invocation

Codex subagents use platform roles, not ITSOL skill names, as agent types. Valid Codex roles are environment-dependent but commonly include `default`, `explorer`, and `worker`. ITSOL skill names such as `itsol-self-review`, `security-api-input-review`, or `dotnet-web-api-review` are routing instructions, not Codex `agent_type` values.

When using Codex subagents:

- For a forked-context review or rubber-duck pass, omit `agent_type` and pass the ITSOL skill name in the task instructions or as a structured skill item.
- For a role-specific Codex agent such as `explorer` or `worker`, omit forked context and provide only the minimal files, plan path, user request, constraints, and expected output.
- Never retry by mixing `fork_context` with an explicit `agent_type` after the API rejects it; choose one mode and continue.
- Always tell the delegated Codex subagent that it is already the delegated subagent and must not start another subagent or external agent CLI.
- Keep the delegated prompt explicit about read-only vs edit rights, owned files, verification, and report contract.

Example Codex rubber-duck prompt shape:

```text
Use the ITSOL self-review workflow as a read-only rubber-duck reviewer.
You are already the delegated subagent; do not spawn another agent or run `codex exec`.
Inspect this plan path and related request. Return blockers, important gaps,
questions for the user, required plan updates, and verdict.
```
