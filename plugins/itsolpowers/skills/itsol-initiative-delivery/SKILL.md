---
name: itsol-initiative-delivery
description: "Autonomous, durable, multi-phase delivery from a large business document: complete-scope intake, requirements traceability, initiative roadmap, decisions, phase orchestration, continuous replanning, QA feedback, progress, resume, and completion. Use when a module, application, migration, or broad capability cannot honestly fit one Business and Technical Plan."
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

Read [references/guide.md](references/guide.md) before starting or resuming an initiative.
