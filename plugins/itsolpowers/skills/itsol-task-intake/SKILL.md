---
name: itsol-task-intake
description: "Task intake: classify work, resolve workflow mode, identify risks, route skills."
---

# ITSOL Task Intake

Classify the work before changing code. Resolve and record the task's mode through `itsol-workflow-mode` before applying functional, bugfix, planning, or implementation gates.

## Process

1. Inspect the request, repository context, and root or most-specific `.itsol.md` policy.
2. Use `itsol-workflow-mode` to resolve and record all seven fields: `workflow_mode`, `mode_source`, `decision_authority`, `scope`, `artifact_state`, `execution_mode`, and `protected_constraints`.
3. Classify the task as requirements/refinement, functional feature, bug, technical planning, code review, self-review, QA handoff, deployment, incident, data/database change, security-sensitive change, or mixed work.
4. Identify user-visible behavior, affected systems, risk, security/data impact, ambiguity, and whether current technology research is required.
5. Route to the smallest relevant process and domain skills; use `itsol-repo-memory` first when `.itsol.md` exists.
6. For functional work, load `itsol-functional-planning` and `itsol-requirements-review`, then branch by the resolved mode:
   - `governed`: retain the full Discovery, Business Plan, Technical Decision, Technical Plan, review, explicit approval, and execution-mode gates.
   - `autonomous-planned`: create and review the plans, resolve material findings, choose the documented recommendation, mark artifacts `Ready for execution`, and continue without approval pauses.
   - `direct`: skip persistent plans, their reviews and approvals, and planning Decision Gates; ask only about material ambiguity, then route implementation.
7. For bugfixes, preserve evidence and regression verification in every mode; defer Fix Plan and Fix Decision Gate prerequisites to `itsol-workflow-mode` and `itsol-bug-debugging`.
8. Keep protected-action authority separate from workflow mode. Stop only for missing authority or an unresolved material choice described by the canonical contract.
9. Propagate the complete seven-field state through compaction, handoffs, plan metadata when plans exist, and every subagent task packet.


## Execution Policy

After resolving `itsol-workflow-mode`, load `itsol-execution-policy`, resolve the complete sibling execution state and observable `done_when`, and preserve both contracts through plans, task context, compaction, delegation, continuation, review, and handoff. Resource policy never changes workflow authority. Do not set `maxTurns`; do not accept agent termination or a `completed` label without validating evidence.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files.
