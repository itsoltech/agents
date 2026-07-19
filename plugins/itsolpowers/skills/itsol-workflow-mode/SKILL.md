---
name: itsol-workflow-mode
description: "Select and preserve the ITSOL engineering workflow mode. Use at task intake and before functional planning, technical planning, bugfix planning, implementation, or subagent delegation when the user may require governed approvals, delegate plan decisions, request work without Business/Technical/Fix Plans, change modes, or rely on .itsol.md workflow defaults or restrictions."
---

# ITSOL Workflow Mode

Resolve the workflow mode before applying planning or implementation gates. Do not resolve or restart a mode for an administrative follow-up that only inspects repository state or locally commits an already-produced coherent slice; preserve the preceding task state and perform the bounded operation directly. If that request also introduces code, configuration, product, or behavior changes, resolve mode only for those new changes. Treat this skill as the canonical authority contract; downstream skills must not redefine different mode semantics. Delivery scale is orthogonal: broad multi-phase work uses `itsol-initiative-delivery` with `delivery_scope: initiative`, normally layered on `autonomous-planned`, rather than inventing a fourth authority mode.

## Resolve The Mode

Use this precedence:

1. Obey platform-level safety and authority rules.
2. Apply root and most-specific project `.itsol.md` `allowed_modes` plus explicit restrictions matching touched paths or operations.
3. Honor an explicit, unambiguous user selection for the current task.
4. Otherwise use the matched `.itsol.md` default when allowed.
5. Otherwise use `governed`.

Select:

- `governed` when the user requests the full planning workflow or does not select another mode.
- `autonomous-planned` when the user asks the agent to create and review plans, make recommended decisions, and continue without approval pauses.
- `direct` when the user explicitly asks to work without Business, Technical, or Technical Fix Plans.

Do not infer autonomy from `continue`, `do it`, silence, or `accept everything` without a clear reference to the current task's planning and decision gates.

Treat root and most-specific project `allowed_modes` as cumulative base restrictions, then intersect every matching path or operation restriction. If the resulting repository policy excludes the selected mode, state the matched policy and ask the user to choose from the allowed modes. Do not silently downgrade or begin work.

## Record And Preserve State

Record this state concisely in the task context and propagate it through compaction summaries, handoffs, plans when present, and subagent task packets:

```yaml
workflow_mode: governed | autonomous-planned | direct
mode_source: explicit-user-task-instruction | repo-default | fallback-default
decision_authority: user | delegated
scope: current-task
artifact_state: draft | approved | ready-for-execution | not-required
execution_mode: pending | inline | subagents | auto
protected_constraints: []
```

If a subagent receives missing, incomplete, inconsistent, or restriction-conflicting mode state, it must return `blocked`; it must not infer delegated authority. All seven fields above are required, including an explicit empty `protected_constraints` list when none apply.

## Apply The Selected Mode

### Governed

Run the normal Discovery, Decision, plan-writing, self-review, automatic isolated Rubber Duck Review through the harness-native plan-review capability, explicit user-approval, and execution-mode gates. Record `artifact_state: draft` while required artifacts are absent or awaiting approval. Record `execution_mode: pending` until the user chooses inline or subagents. New plan files start as `Draft` and become `Approved` only after the user sees and explicitly approves the specific file; only then record `artifact_state: approved`.

### Autonomous Planned

Create the normal Business, Technical, or Technical Fix Plan artifacts with `artifact_state: draft`. Run self-review and automatic isolated Rubber Duck Review through the harness-native plan-review capability, resolve material findings, choose the documented recommended approach, then change the artifact state to `ready-for-execution` and continue without asking the user to approve each plan.

Never describe `Ready for execution` as explicit user approval. Ask one targeted question only when equally plausible choices materially change user-visible behavior, permissions, data handling, rollout, or architecture.

### Direct

Do not require persistent Business, Technical, or Technical Fix Plan files, plan reviews, Decision Gates, plan approvals, plan paths, or an execution-mode approval. Use `artifact_state: not-required` and choose inline versus subagents from task size and independent surfaces.

Continue to require applicable bug evidence, focused domain skills, TDD or documented replacement verification, implementation review, and final self-review. Ask only for a material ambiguity that cannot be resolved safely within the authorized scope.

## Keep Action Authority Separate

Workflow autonomy does not authorize unrelated or externally consequential actions. Request only the missing authority for destructive data operations, unrequested production publication or deployment, retrieving or exposing secrets outside the authorized task, external communications or purchases, or security weakening. Ordinary in-scope implementation and use of already-authorized configuration do not create a new approval pause.

## Change Modes

Apply an explicit mode change only to remaining work and retain existing artifacts.

- When changing to `governed`, pause remaining implementation until newly required governed gates are satisfied.
- When changing from `governed` to an autonomous mode, retain reviewed artifacts and remove only future approval pauses.

Read [references/guide.md](references/guide.md) for repository policy syntax, transitions, examples, artifact metadata, and consumer obligations.
