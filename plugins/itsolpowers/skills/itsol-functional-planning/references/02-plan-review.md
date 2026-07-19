# Plan Self-Review And Rubber Duck Review

This applies only to planned modes under `itsol-workflow-mode`. `direct` skips persistent plan review while retaining implementation self-review.

## Business Plan Self-Review

Check that:

- no `TODO`, `TBD`, placeholders, empty sections, or filler remain;
- goal, current/desired behavior, scope, exclusions, and acceptance criteria are specific;
- scenarios are a governed user choice, autonomous documented recommendation, forced convention, or low-risk assumption that does not alter business behavior;
- rules cover edges, negative paths, roles, permissions, tenants, and data ownership;
- UX/API behavior and copy are testable;
- QA covers happy, negative, permission, legacy-data, integration-failure, and regression paths;
- risks, assumptions, and questions are resolved or safe to carry without changing scope, behavior, architecture, rollout, or expectations;
- the plan is one coherent first delivery.

## Technical Plan Self-Review

Check that:

- exact files or bounded areas are named where knowable;
- approach is a governed user choice, autonomous documented recommendation, or forced architecture;
- required ITSOL skills map to tasks/reviews;
- Repo Memory and Current Tech Context appear when applicable;
- logical branches cover validation, authorization, tenancy, errors, idempotency, retries, concurrency, and compatibility;
- TDD has executable RED/GREEN/REFACTOR or a policy-backed exception with replacement verification;
- tasks have files, skills, steps, verification, and Angular commit labels;
- subagent graph, ownership, response evidence, review split, and concurrency are executable without guessing;
- commands, QA, rollout, rollback, monitoring, and migration are concrete or explicitly not applicable;
- no task depends on undefined contracts, services, types, or hidden assumptions.

Fix gaps inline. Ask one targeted question for unresolved material ambiguity; document deliberate deferrals as out of scope.

## Rubber Duck Review

Use `itsol_plan_review`, which automatically runs a separate read-only context with `itsol-self-review`. This reviewer is pre-authorized by a planned workflow within execution ceilings; do not ask the user to authorize it. Provide plan path, request, complete workflow state, confirmed scope or selected/recommended approach, and minimal repo evidence. The reviewer must not edit or nest delegation. Repeat review after material changes. The extension allows up to `review.plan_max_rounds` iterative attempts per artifact (default 10) and stops earlier on the first material-blocker-free verdict.

### Business Plan Questions

- What user, role, tenant, or decision owner is missing?
- Which acceptance criterion is too vague for QA?
- Which edge, negative, permission, integration-failure, or legacy-data path is absent?
- Which assumption changes business behavior and lacks valid mode authority?
- Is scope coherent, and do exclusions leak into acceptance, QA, rollout, or support?
- Which UX/API behavior, copy, error state, audit, report, export, notification, or communication is underspecified?
- What could make the client reject the result even if code matches the plan?

### Technical Plan Questions

- Is the approach mode-invalid, weakly justified, or inconsistent with the Business Plan?
- Which file, module, endpoint, component, schema, migration, client, job, cache, event, config, or deployment surface is missing?
- Which branch, validation, authorization, tenant, idempotency, retry, compatibility, or error rule is vague?
- Which focused skill, Current Tech Context check, or review area is missing?
- Which RED/GREEN step or replacement verification is not executable?
- Which command, QA scenario, migration check, rollback, monitoring, or release-order step is absent?
- What could fail in production even if every task is implemented?

## Report Contract And Readiness

Return plan/context inspected; blockers, important gaps, and non-blocking suggestions; questions requiring user decisions; sections to update; unverified items/coverage gaps; and verdict.

- In `governed`, `ready for approval` permits presenting the specific `Draft`; explicit approval then changes it to `Approved`.
- In `autonomous-planned`, `ready for execution` permits `Draft` to become `Ready for execution` without a pause; this is not user approval.
- In both planned modes, material findings block progression.
- In `direct`, no plan-review verdict exists.

If isolated review fails or the configured reviewer/round ceiling is exhausted, report the genuine blocker rather than inventing a verdict. Do not return to the user while another automatic review attempt remains actionable. Non-blocking suggestions may be deferred only with an explicit scope reason.
