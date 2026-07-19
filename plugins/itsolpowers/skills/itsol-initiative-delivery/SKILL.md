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
- Rubber Duck-review the initiative roadmap and every required phase plan. A changed roadmap invalidates its earlier review.
- Continue through executable phases without returning for routine approval in `autonomous-planned`.
- Ask only for a material business, product, scope, data, security, rollout, or architecture decision that cannot be safely recommended under delegated authority, or for a separately protected action.

## Lifecycle

1. **Intake:** inspect the whole source and repository; extract requirements, acceptance criteria, constraints, unknowns, and initiative-level completion criteria.
2. **Roadmap:** assign every requirement to one or more phases; document dependencies, phase outcomes, system QA, rollout, and cross-cutting architecture.
3. **Review:** self-review and invoke the harness-native automatic plan-review capability for the initiative roadmap. Resolve findings before marking it ready.
4. **Execute phases:** plan, review, implement, independently review, integrate, QA, and record evidence. Automatically start the next dependency-ready phase.
5. **Adapt:** classify discoveries and QA feedback, record decisions, update impacted living documents, replan future work, and Rubber Duck-review the changed roadmap.
6. **Complete:** require explicit disposition for every requirement, completed phases, no pending decisions, system verification, current documentation, and no hidden scope gaps.

## Decision boundary

Resolve ordinary implementation and evidence-backed architecture choices autonomously and record them. Open a targeted user decision when equally plausible choices materially alter product intent, permissions, data handling, contractual behavior, cost/rollout, or initiative scope. Include context, options, recommendation, impacted requirements/phases, and the default that would be used if authority permits. Bundle related questions.

Deferring or rejecting a requirement changes initiative scope and therefore requires a resolved user decision. Production deployment, destructive data work, external communications, secret exposure, purchases, or security weakening retain separate protected-action authority.

## Continuous documentation

Do not rewrite the immutable source. Update the normalized initiative, requirements traceability, roadmap, architecture baseline, decisions/ADRs, phase results, QA evidence, and progress after each material discovery. Link decisions to requirements and phases. QA failures create traced fix work rather than informal notes.

## Execution Policy

Load `itsol-execution-policy` after workflow mode and preserve it through every phase and subagent packet. Standard initiative delivery uses unlimited distinct identities with bounded parallel batches; do not create a numeric whole-initiative agent ceiling without explicit user or repository authority. Phase and initiative completion remain evidence-based and are not implied by an agent stopping.

Read [references/guide.md](references/guide.md) before starting or resuming an initiative.
