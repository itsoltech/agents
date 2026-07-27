---
name: itsol-initiative-delivery
description: "Deliver multi-phase initiatives beyond one plan with traceability and resumable state."
---

# ITSOL Initiative Delivery

Use this workflow for a broad business source whose complete intended outcome needs multiple implementation and QA phases. It is a delivery-scope layer, not a fourth authority mode: resolve `itsol-workflow-mode`, then record `delivery_scope: initiative`. Normally combine it with `autonomous-planned`; `governed` remains valid when the user requests initiative-level approvals. Never use `direct` for an initiative.

## Non-negotiable contract

- Analyze the complete source before choosing implementation work.
- Give every requirement a stable ID and explicit disposition. Never silently pick one slice and call the initiative complete.
- Preserve the original source as an immutable snapshot. Maintain clarified intent, roadmap, architecture, decisions, traceability, progress, and phase evidence as living repository artifacts.
- Use the harness-native durable initiative-state capability. Do not rely on conversation history as the only state.
- Decompose work into dependency-aware, outcome-oriented vertical phases. Existing Business, Technical, TDD, delegation, code-review, integration, and QA workflows apply inside each phase.
- Self-review the initiative roadmap and required phase plans proportionately. Use isolated review when required by policy or justified by material initiative risk; a materially changed reviewed roadmap invalidates its earlier verdict.
- Continue through executable phases without returning for routine approval in `autonomous-planned`.
- Ask only for a material business, product, scope, data, security, rollout, or architecture decision that cannot be safely recommended under delegated authority, or for a separately protected action.

## Lifecycle

1. **Intake:** inspect the whole source and repository; extract requirements, acceptance criteria, constraints, unknowns, and initiative-level completion criteria.
2. **Roadmap:** assign every requirement to one or more phases; document dependencies, phase outcomes, system QA, rollout, and cross-cutting architecture.
3. **Review:** self-review the initiative roadmap, then follow the effective review trigger. With `adaptive`, use the read-only specialist panel only when breadth, uncertainty, novelty, cross-phase dependencies, or security/data risk justify its cost. Resolve concrete material findings; do not rerun for preferences, optional detail, or speculative concerns.
4. **Execute phases:** plan, review, implement, independently review all changed surfaces, integrate, run application-aware QA, and record fingerprint-bound evidence. Automatically start the next dependency-ready phase.
5. **QA loop:** choose browser/UI, API, backend, interactive CLI, Electron, mobile, data, infrastructure, or combined system QA from the application shape. A failed verdict routes to implementation fix, plan revision, or a user decision. After fixes, rerun applicable plan review and code review, then execute fresh QA; repeat until PASS.
6. **Adapt:** classify discoveries and QA feedback, record decisions, update impacted living documents, replan future work, and re-review a changed roadmap only when policy requires it or the change materially affects confidence.
7. **Complete:** require explicit disposition for every requirement, completed phases, a passing QA verdict per phase, current passing final-system QA, no pending decisions, synchronized documentation, and no hidden scope gaps.

## Decision boundary

Resolve ordinary implementation and evidence-backed architecture choices autonomously and record them. Open a targeted user decision when equally plausible choices materially alter product intent, permissions, data handling, contractual behavior, cost/rollout, or initiative scope. Include context, options, recommendation, impacted requirements/phases, and the default that would be used if authority permits. Bundle related questions.

Resolve `.itsol.md` QA policy before creating QA work. `qa.profile: off` explicitly skips QA gates for projects that cannot be run; `evidence` accepts configured command/manual evidence without automatic specialist execution; `automatic` selects application-aware agents; `strict` adds the strongest coverage. Preserve `qa.max_cycles`, configured application types, commands, targets, and matching restrictions. A policy skip must be reported honestly and must never be presented as QA PASS.

QA evidence must be observed rather than planned. Use the harness-native QA planning/verdict capability to create domain packets, execute all required coverage, and bind PASS to the implementation fingerprint. Any implementation change invalidates final system QA. Do not substitute a generic test command when the application requires browser, interactive CLI, desktop/mobile, API, data, or infrastructure behavior checks.

Deferring or rejecting a requirement changes initiative scope and therefore requires a resolved user decision. Production deployment, destructive data work, external communications, secret exposure, purchases, or security weakening retain separate protected-action authority.

## Continuous documentation

Do not rewrite the immutable source. Update the normalized initiative, requirements traceability, roadmap, architecture baseline, decisions/ADRs, phase results, QA evidence, and progress after each material discovery. Link decisions to requirements and phases. QA failures create traced fix work rather than informal notes.

## Execution Policy

Load `itsol-execution-policy` after workflow mode and preserve it through every phase and subagent packet. Standard initiative delivery uses unlimited distinct identities with bounded parallel batches; do not create a numeric whole-initiative agent ceiling without explicit user or repository authority. Phase and initiative completion remain evidence-based and are not implied by an agent stopping.

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
├── qa/                          # fingerprint-bound phase/system QA verdicts
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
→ integrate and run application-aware QA
→ QA PASS: record requirement/phase evidence
→ QA FAIL: classify implementation-fix | plan-revision | user-decision
→ fix or replan, rerun plan/code review, execute fresh QA
→ continue only after PASS
```

Do not return to the user between executable phases. If a harness/session must stop, leave canonical state and next action resumable; never claim the initiative completed.

## Completion evidence

Initiative completion requires:

1. all phases completed;
2. every requirement `implemented`, `deferred`, or `rejected`;
3. every defer/reject linked to a resolved user decision;
4. no pending decision or unresolved material review finding;
5. a fingerprint-bound passing QA verdict for every phase and a current final system QA/regression PASS;
6. documentation and architecture synchronized with implementation;
7. rollout/rollback and operational evidence when applicable;
8. exact initiative completion criteria covered.

Application-aware QA selects real interaction evidence: agent-browser for web UI, CDP/browser automation for Electron, interactive execution for CLI, contract/integration/security scenarios for APIs, device/runtime checks for mobile, integrity/migration/rollback for data, and readiness/observability/rollback for infrastructure. A code change after final QA makes that verdict stale and requires fresh system QA.

The final handoff summarizes delivered outcomes, requirement dispositions, decisions, verification, operational notes, and remaining explicitly authorized deferrals. It must not hide gaps behind completed phase counts.
