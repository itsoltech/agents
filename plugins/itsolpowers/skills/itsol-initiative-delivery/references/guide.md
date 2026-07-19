# ITSOL Initiative Delivery Reference

This delivery-scale reference is governed by the authority and artifact semantics in `itsol-workflow-mode`; it does not redefine them.

## Canonical artifact layout

```text
.itsol/initiatives/<initiative-id>/
├── source/                       # immutable source snapshot
├── initiative.md                # living normalized product intent
├── requirements.md              # requirement-to-phase/evidence traceability
├── roadmap.md                   # reviewed dependency-aware phase roadmap
├── architecture.md              # living baseline and accepted ADR links
├── progress.md                  # generated current progress and next action
├── decisions/                   # DEC/ADR records
├── phases/<phase-id>-<slug>/     # phase plans, QA, and result evidence
└── state.json                    # canonical machine-readable state
```

`.itsol.md` remains stable repository policy. Do not put initiative progress or temporary decisions there.

## Requirement disposition

Every extracted requirement uses a stable `REQ-NNN` identifier and one of:

- `planned` — assigned to at least one phase;
- `in-progress` — active implementation or verification;
- `implemented` — concrete acceptance evidence recorded;
- `blocked` — blocker and next authority/action recorded;
- `deferred` — intentionally removed from current delivery through a resolved user decision;
- `rejected` — intentionally rejected through a resolved user decision.

A broad source is not fully analyzed until every material requirement is represented. Avoid false precision: progress is phase and requirement disposition, not an invented percentage.

## Phase design

Prefer vertical, demonstrable outcomes over frontend/backend/database-only phases. Use workstreams inside a phase for parallel specialist execution. A phase defines:

- outcome and included requirement IDs;
- dependencies and affected contracts;
- Business/Technical artifacts required by workflow mode;
- TDD or approved replacement verification;
- implementation ownership and review surfaces;
- integration and QA criteria;
- rollout/rollback when relevant;
- observable `done_when` and result evidence.

Complete a phase only when its requirements are implemented or explicitly dispositioned and integration/QA evidence exists. Phase completion does not authorize initiative completion; continue automatically to the next dependency-ready phase.

## Change classification

| Discovery | Required action | User pause |
| --- | --- | --- |
| Clarification within accepted intent | Update living product notes and traceability | no |
| Local technical choice | Record ADR when durable; update current phase | no |
| Cross-phase architecture or QA finding | Impact analysis, update architecture/roadmap, rerun roadmap review | no when safely recommendable |
| Material product/data/security ambiguity | Open decision with recommendation and impacts | yes |
| Requirement defer/reject or charter change | User-resolved scope decision, then replan | yes |
| Protected external/destructive action | Request only the missing action authority | yes |

After a decision, update all impacted requirements, phases, plans, tests, architecture notes, and progress. Preserve superseded reasoning in the decision log rather than erasing history.

## Autonomous control loop

```text
load durable state
→ resolve pending decision or protected blocker
→ review changed roadmap if stale
→ choose dependency-ready phase
→ plan and review phase
→ delegate independent workstreams
→ review changed surfaces
→ integrate and run QA
→ record requirement and phase evidence
→ classify discoveries and replan when needed
→ continue
```

Do not return to the user between executable phases. If a harness/session must stop, leave canonical state and next action resumable; never claim the initiative completed.

## Completion evidence

Initiative completion requires:

1. all phases completed;
2. every requirement `implemented`, `deferred`, or `rejected`;
3. every defer/reject linked to a resolved user decision;
4. no pending decision or unresolved material review finding;
5. final system-level QA/regression evidence;
6. documentation and architecture synchronized with implementation;
7. rollout/rollback and operational evidence when applicable;
8. exact initiative completion criteria covered.

The final handoff summarizes delivered outcomes, requirement dispositions, decisions, verification, operational notes, and remaining explicitly authorized deferrals. It must not hide gaps behind completed phase counts.
