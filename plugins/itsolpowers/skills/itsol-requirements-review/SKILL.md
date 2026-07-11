---
name: itsol-requirements-review
description: "Requirements review: stories, DoR, scope, roles, edge cases, MVP readiness by workflow mode."
---

# ITSOL Requirements Review

Resolve and preserve the complete task state through `itsol-workflow-mode` before deciding how much discovery is required. Check whether work is clear, testable, scoped, and ready without recreating skipped planning gates.

## Process

1. Confirm all seven workflow-state fields are known and propagate them in the report or handoff.
2. Identify the business problem, user, decision owner, expected outcome, explicit out-of-scope items, and material ambiguity.
3. Classify process formalism by risk, size, team, data, security, production impact, and the resolved workflow mode.
4. Review story or technical-task structure, acceptance criteria, roles, permissions, data, UI/API/integration impact, and edge cases.
5. Branch discovery through `itsol-workflow-mode`:
   - `governed`: for vague functional requests, run the full PM/client Discovery Gate and Definition-of-Ready interview before a Business Plan is written.
   - `autonomous-planned`: gather enough evidence to write sound plans, use safe repo-backed assumptions, and ask one targeted question only when equally plausible choices materially alter behavior, permissions, data, rollout, or architecture.
   - `direct`: do not require Business Plan material or approval; ask only for a material ambiguity that cannot be safely resolved, then return implementation-ready scope and risks.
6. In `governed`, feed clarified material to `itsol-functional-planning` and require explicit user approval before technical planning. In `autonomous-planned`, feed it forward without an approval pause. In `direct`, route directly to implementation with `artifact_state: not-required`.
7. Distinguish clarification from scope change and make blockers, assumptions, owners, protected constraints, and unresolved risks explicit.

Read [references/guide.md](references/guide.md) first; then read only the sector files relevant to the situation.
