# Planning And Delegation

Use `itsol-workflow-mode` as authorization source. Require `workflow_mode`, `mode_source`, `decision_authority`, `scope`, `artifact_state`, `execution_mode`, and `protected_constraints`; return `blocked` for missing, incomplete, inconsistent, or restriction-conflicting state.

## Preconditions

- In `governed`, specific Business/Technical Plans are genuinely `Approved` after presentation and the user selected subagent execution.
- In `autonomous-planned`, reviewed plans are `Ready for execution` and execution is selected or `auto`.
- In `direct`, `artifact_state: not-required`; no plan files/paths, Decision Gates, reviews, approvals, or execution-mode approval are required.
- `draft` never authorizes implementation. Commit only when separately authorized.

## Main Agent Responsibilities

The main agent owns the run: source of truth, task graph/queue/statuses/dependencies, concurrency, packets, write ownership, integration, shared contracts, response validation, independent review, semantic conflict resolution, final validation, and preservation of user changes. It resolves `partial`, `blocked`, and `failed` results instead of hiding them. Use inline execution for tiny, tightly coupled, sequential work.

## Task Graph

Each node records stable id/name; type (`implementation`, `review`, `research`, `rubber-duck`, `verification`, `integration`); dependencies; owned write or read-only scope; status; assigned skill/agent; evidence; risks, assumptions, and questions.

Statuses:

- `planned`: defined but not ready;
- `queued`: ready, waiting for capacity;
- `active`: assigned and running;
- `reviewing`: ready for independent review;
- `changes-requested`: actionable review findings exist;
- `completed`: packet, evidence, and verification satisfied;
- `partial`: useful result but packet incomplete;
- `blocked`: missing context, authority, dependency, ownership, or decision;
- `failed`: attempted but unusable or constraint-breaking;
- `deferred`: intentionally postponed with owner/risk.

## Task Split

Split by independently owned UI flow/component, API/service/validation path, model/migration/query/cache path, integration/job/client/infra path, or focused test/diagnostic. Prefer smaller slices when ownership/risk is unclear. Serialize tasks touching the same files or semantic contract.

## Task Packet

Every packet includes:

- all seven workflow-state fields and mode-valid source of truth;
- goal and observable acceptance criteria;
- relevant constraints, assumptions, and dependency state;
- read scope, exclusive write scope or `read-only`, and forbidden scope;
- required process/domain/review skills;
- RED/GREEN expectation or documented TDD exception;
- focused and wider verification/evidence expected;
- expected artifacts;
- response contract and allowed statuses;
- budget where useful;
- stop conditions and escalation triggers.

Documentation/config packets state the TDD exception before editing. Code packets name expected tests, focused RED/GREEN command, and wider handoff command.

## Write Ownership

Use one writer per file, directory slice, migration, generated artifact, or semantic contract. Reviews/research are read-only unless explicitly granted writes. Keep generated source and outputs together where possible. Stop for needed files outside scope or overlapping user/agent ownership.

Semantic contracts include API shapes, schema meaning, auth/tenant decisions, environment variables, generated-client assumptions, prompt contracts, and user-visible workflow—even when files differ.

## Stop Conditions

Return `blocked` or `partial` for invalid/missing workflow state; unavailable/contradictory source of truth; material business/architecture/security/data/rollout decision; protected action; out-of-scope write; ownership conflict; unavailable verification without replacement; excessive scope/budget; needed nested delegation/external agent CLI; secrets/production data/unsafe commands; or conflict with another result. Report exact evidence, safe remainder, and recommended resolution.

## Response Contract

Every response includes:

- status (`completed`, `partial`, `blocked`, or `failed`), task id/name;
- changed files or inspected scope;
- work summary and key evidence;
- verification commands/results or reason absent;
- RED/GREEN or TDD exception/replacement evidence;
- assumptions and whether within authorized scope;
- unverified items and coverage gaps;
- risks, follow-ups, deferred findings;
- blockers/decisions required;
- next independent review target when files changed.

Text alone is not completion. The main agent validates evidence and packet fulfillment.

## Parallelism

Use one concurrent implementation for high-conflict migrations/shared/auth/security contracts; two for separate ownership with integration points; three for clearly independent surfaces; more than three only with explicit authority and strong independence. Never exceed the selected/approved limit.

## Implementation Delegation

Use the narrowest matching skill; provide bounded ownership and forbidden areas; require TDD/replacement verification, preservation of user changes, and response contract; prohibit speculative refactors. Do not delegate the current blocker, approval decisions, or final integration responsibility.

## Delegation Depth

Only the main agent delegates. A delegated agent works directly and must not spawn subagents, run `codex exec`, `claude`, or another agent CLI. If too broad, it returns a proposed split and unresolved questions.

## Codex Invocation Guidance

ITSOL skill names are instructions, not platform `agent_type` values. For forked-context review/Rubber Duck work, omit explicit `agent_type` and name the skill in instructions. For a role-specific worker/explorer, omit forked context and provide minimal context manually. Never combine forked context with explicit role. State read-only/edit rights, owned files, verification, response contract, and that the recipient is already delegated and cannot delegate again.
