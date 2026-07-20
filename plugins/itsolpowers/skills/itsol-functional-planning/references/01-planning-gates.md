# Planning Gates By Workflow Mode

Resolve and record all seven fields through `itsol-workflow-mode` before applying these gates. Repository restrictions and protected-action authority remain independent.

## Governed

For functional tasks in `governed`, do not edit production code until:

- Discovery has enough confirmed scope to avoid material guessing.
- A Business Plan exists as `Draft`, passes proportionate self-review and any review required or selected under the effective policy, has concrete material findings resolved, is presented to the user, and is explicitly approved as that specific file.
- The Technical Decision Gate presents options or a forced approach and the user chooses or approves the approach.
- A Technical Plan exists as `Draft`, passes proportionate self-review and any required/selected isolated review, has concrete material findings resolved, is presented, and is explicitly approved as that specific file.
- The user chooses subagent-driven or inline execution.

Governed approval is explicit, separate, and informed. Only after the user sees the specific artifact and answers the direct approval request may its status become `Approved`. The original request, `continue`, `direct user request`, silence, or a generic agent statement is not approval.

## Autonomous Planned

For functional tasks in `autonomous-planned`:

1. Gather enough scope to avoid material guessing; ask one targeted question only for an equally plausible choice that materially changes behavior, permissions, data, rollout, or architecture.
2. Create the Business Plan as `Draft`, self-review it proportionately, run isolated review only when policy or material risk warrants it, and resolve concrete material findings.
3. Mark it `Ready for execution` with delegated current-task authorization; do not call it user-approved.
4. Record feasible technical options and choose the documented recommendation without pausing at the Technical Decision Gate.
5. Create and review the Technical Plan the same way, then mark it `Ready for execution`.
6. Choose subagent-driven or inline execution based on task size and independent surfaces and continue.

Concrete material blockers remain blockers in this mode. Delegated authority removes approval pauses; it does not lower plan quality or broaden scope. Minor suggestions do not create another gate.

## Direct

For functional tasks in `direct`:

- do not create or require Business/Technical Plan files;
- do not run plan self-review, Rubber Duck Plan Review, Technical Decision Gate, plan approval, plan-path, or execution-mode approval gates;
- record `artifact_state: not-required`;
- inspect the request and repo, ask only about unresolved material ambiguity, and route implementation;
- retain focused skills, TDD or replacement verification, implementation review, final self-review, and protected-action authority.

If the user explicitly asks to skip planning, honor `direct` when repository policy allows it; never create shortened substitute plans.

## Paths And State

For planned modes, default to:

- `.itsol/plans/YYYY-MM-DD-<task-slug>-business.md`
- `.itsol/plans/YYYY-MM-DD-<task-slug>-technical.md`

Use another location only for an established repo convention or explicit request. Every planned artifact records `Workflow Mode` and `Authorization`. Every handoff propagates `workflow_mode`, `mode_source`, `decision_authority`, `scope`, `artifact_state`, `execution_mode`, and `protected_constraints`.

## Mode Changes

Follow `itsol-workflow-mode`: retain existing artifacts; apply the new mode only to remaining work. A transition to `governed` pauses at the next missing governed gate. A transition to an autonomous mode removes only future approval pauses.
