---
name: itsol-bug-debugging
description: "Evidence-first bugfix workflow by workflow mode."
---
# ITSOL Bug Debugging

Resolve all seven task-state fields through `itsol-workflow-mode`. In every mode gather evidence, isolate the failing boundary, establish root cause, use `itsol-tdd-workflow` or documented replacement verification, implement the smallest fix, and self-review.

## Mode Branches

- `governed`: run the Fix Decision Gate, wait for the user's choice, create a `Draft` Technical Fix Plan, self-review and Rubber Duck-review it, resolve material findings, present the file, obtain explicit approval, mark it `Approved`, then implement.
- `autonomous-planned`: record options and choose the documented recommendation, create the plan as `Draft`, self-review and Rubber Duck-review it, resolve material findings, mark it `Ready for execution` with delegated authorization, and continue without approval pauses.
- `direct`: do not create or require a Fix Plan, Fix Decision Gate, plan review, approval, or plan path. Record `artifact_state: not-required` and proceed from evidence/root cause to TDD or replacement verification and implementation.

Never call an autonomous plan user-approved. Ask only for unresolved material ambiguity or independent protected-action authority. Apply `.itsol.md` through `itsol-repo-memory` when present and propagate all seven fields to artifacts and handoffs.

Read [references/guide.md](references/guide.md), then only relevant evidence references.
