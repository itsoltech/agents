---
name: itsol-functional-planning
description: "Functional planning by workflow mode: governed approvals, autonomous reviewed plans, or direct execution."
---

# ITSOL Functional Planning

Resolve and preserve the task state through `itsol-workflow-mode` before applying discovery or planning gates. Do not duplicate the canonical mode contract here.

## Automatic Rubber Duck gate

In `governed` and `autonomous-planned`, invoke the harness-native automatic plan-review capability for each completed Business, Technical, or Technical Fix Plan after self-review. It runs an isolated read-only context with the `itsol-self-review` skill automatically. Do not ask the user to authorize this reviewer and do not hand off a plan before a current passing verdict. Resolve material findings in the artifact and rerun within the execution-policy round ceiling. Only a genuine reviewer failure or exhausted ceiling may return as an explicit blocker.

## Shared Process

If the source describes a whole application, module, migration, or multi-phase capability, load `itsol-initiative-delivery` first. Build complete initiative traceability and a reviewed roadmap; then apply this Business/Technical planning process within outcome-oriented phases. Do not reduce the source to one phase and hand off as though the full request were complete.

1. Inspect the request, repo context, and applicable `.itsol.md` policy; record and propagate all seven workflow-state fields.
2. Load `itsol-requirements-review` and inspect enough code, contracts, tests, and conventions to avoid asking questions the repository answers.
3. Ask one targeted question only when an unresolved material ambiguity cannot be resolved safely. Never invent product scope from internet defaults.
4. Keep applicable current-tech research, TDD/replacement verification, implementation review, and protected-action authority independent of planning ceremony.

## Governed

In `governed`, retain the existing workflow: run the full Discovery Gate for incomplete requests; write a `Draft` Business Plan; self-review it; obtain a material-blocker-free Rubber Duck Review; present the specific file and get explicit user approval. Then run the Technical Decision Gate and wait for the user's approach choice, write and review a `Draft` Technical Plan, get explicit approval of that specific file, and ask for subagent-driven or inline execution. Only user-approved governed plans use `Approved`.

## Autonomous Planned

In `autonomous-planned`, create the same Business and Technical Plan artifacts. Start each as `Draft`, self-review it, run Rubber Duck Review, resolve all material findings, record/choose the documented recommendation at the Technical Decision Gate without pausing, and mark the artifact `Ready for execution`. Record `Workflow Mode: autonomous-planned` and delegated current-task authorization; never describe it as user-approved. Choose execution mode from task size and independent surfaces and continue.

## Direct

In `direct`, do not create or require persistent Business or Technical Plans, plan reviews, approvals, planning Decision Gates, plan paths, or execution-mode approval. Record `artifact_state: not-required`, establish the smallest safe implementation scope from the request and repo evidence, ask only about material ambiguity, then route to `itsol-feature-implementation` and `itsol-tdd-workflow` inline or through `itsol-subagent-workflow` as appropriate.


## Execution Policy

After resolving `itsol-workflow-mode`, load `itsol-execution-policy`, resolve the complete sibling execution state and observable `done_when`, and preserve both contracts through plans, task context, compaction, delegation, continuation, review, and handoff. Resource policy never changes workflow authority. Do not set `maxTurns`; do not accept agent termination or a `completed` label without validating evidence.

Read [references/guide.md](references/guide.md) before presenting or reviewing planned-mode artifacts. If the task is not functional implementation, route to the narrower workflow.
