# ITSOL Workflow Mode Reference

Use this reference when implementing or reviewing workflow-mode consumers, `.itsol.md` policy, artifact status, delegation, or mode transitions.

## State And Authorization

Workflow mode controls process ceremony. It does not expand task scope or replace platform safety rules.

| Mode | Decision authority | Artifact state | Planning pauses |
| --- | --- | --- | --- |
| `governed` | user | `draft`, then `approved` after specific approval | required |
| `autonomous-planned` | delegated | `draft`, then `ready-for-execution` after proportionate self-review and any applicable isolated review | omitted |
| `direct` | delegated within requested scope | `not-required` | omitted |

`Approved` is an audit claim that the user saw and accepted a specific artifact. Never use it for an autonomously reviewed artifact. `Ready for execution` means proportionate self-review passed, any review required or selected under the effective policy passed, and concrete material findings are resolved.

Use `execution_mode: pending` before a governed execution-mode choice. Change it to `inline` or `subagents` only after the user chooses. Autonomous modes may use `auto` until the agent selects the execution shape from task size and independent surfaces.

## Selection Examples

Select `governed`:

- “Use the full workflow and ask me to approve each plan.”
- No explicit mode instruction and no repository default.

Select `autonomous-planned`:

- “Prepare the plans, Rubber Duck-review them, make the recommended decisions yourself, and work without asking me to approve every plan.”
- “I delegate plan decisions for this task; continue until the goal is reached.”

Select `direct`:

- “Work without Business, Technical, or Fix Plans.”
- “Skip planning artifacts and implement directly, but still test and review the work.”

Do not change mode for:

- “continue”
- “do it”
- “accept everything” without a reference to current workflow gates
- silence or lack of objections

## Repository Policy

Document optional stable defaults and restrictions in root `.itsol.md` or the most-specific project section:

```yaml
workflow:
  default_mode: governed
  allowed_modes:
    - governed
    - autonomous-planned
    - direct
  restrictions:
    - match:
        path: infra/production
      allowed_modes:
        - governed
    - match:
        operation: production-deploy
      allowed_modes:
        - governed
```

Use normal repo-memory prefix matching for project defaults. Start with the intersection of root and most-specific project `allowed_modes`, then intersect `allowed_modes` from every restriction matching a touched path or operation. A task-level selection overrides a repository default but not these base or matching restrictions. If the intersection excludes the requested mode, report the matched rules and ask the user to select one of the remaining modes.

Do not create or change `.itsol.md` merely because a task selects a mode. Persist a default only when the user requests it or an approved scope includes a stable repository-policy update.

## Artifact Metadata

Governed plan:

```markdown
**Status:** Approved
**Workflow Mode:** governed
**Authorization:** Explicit user approval after presentation
```

Autonomous plan:

```markdown
**Status:** Ready for execution
**Workflow Mode:** autonomous-planned
**Authorization:** Delegated by user for the current task
**Rubber Duck Verdict:** Ready <!-- include only when isolated review ran -->
```

Direct execution has no required plan artifact. Record `artifact_state: not-required` in task state and final handoff.

## Decision Gates

In `governed`, present options or a forced approach and wait for the user's selection before locking the plan.

In `autonomous-planned`, present or record feasible options, choose the documented recommendation, and continue. Ask only when no safe recommendation exists because materially different interpretations remain equally plausible.

In `direct`, make ordinary implementation decisions from repository evidence and the user's goal. Do not recreate Business or Technical Decision Gates under another name.

## Mode Transitions

| Transition | Remaining-work behavior |
| --- | --- |
| `direct` to `governed` | retain completed work; create and approve missing artifacts before more implementation |
| `direct` to `autonomous-planned` | retain completed work; create and review the normal missing plan artifacts for remaining work before more implementation |
| `governed` to `autonomous-planned` | retain approved/reviewed artifacts; remove future approval pauses |
| `governed` to `direct` | retain artifacts for audit; stop requiring new plan artifacts |
| `autonomous-planned` to `direct` | retain reviewed artifacts for audit; stop requiring new plan artifacts or planning gates for remaining work |
| autonomous mode to `governed` | pause at the next missing governed gate |

Summarize the transition, prior decisions, completed work, and remaining gates. Never delete plan history to make a transition appear cleaner.

## Consumer Obligations

- Bootstrap and router: resolve mode before routing functional, bugfix, planning, or implementation gates.
- Task intake and requirements: run full discovery by default only in `governed`; autonomous modes ask only material blockers.
- Functional/technical/fix planning: branch explicitly by mode and use honest artifact states.
- Feature/debugging implementation: accept `approved`, `ready-for-execution`, or `not-required` according to mode.
- Self-review: reject false `Approved` claims and unresolved material findings; do not reject a valid autonomous state merely because user approval is absent.
- Subagent workflow: include all seven mode-state fields in every task packet, using an explicit empty `protected_constraints` list when applicable; return `blocked` when state is missing, incomplete, inconsistent, or conflicts with a matched restriction.
- Repo memory: read defaults and restrictions before mode resolution when `.itsol.md` exists.
- Domain skills: defer plan prerequisites to this contract instead of restating unconditional gates.
- Final handoff: report selected mode, source, review and verification evidence, unresolved risks, and any separate action authorization.

## Protected Actions

Treat these as authority questions rather than planning-mode questions:

- destructive or irreversible data operations
- production deployment/publication not already requested
- retrieving or exposing secrets outside the authorized task
- external messages, purchases, or account changes
- security weakening

Do not use this list to pause ordinary file edits, tests, local builds, in-scope configuration use, or reversible implementation steps.
