---
name: itsol-execution-policy
description: "Resolve and preserve cost-aware model, reasoning, delegation, parallelism, review, completion, and stop boundaries for ITSOL engineering work. Use after itsol-workflow-mode at task intake, before delegation, for long-running agent work, and whenever the user sets agent, budget, model, reasoning, review-round, or stop-point limits."
---

# ITSOL Execution Policy

A commit-only or repository-inspection follow-up for an already-produced slice reuses the preceding task's policy and evidence. Do not create a new execution policy, agent budget, review cycle, or completion gate solely for that bounded administrative operation.

Resolve this policy after `itsol-workflow-mode`. Keep resource limits independent from decision authority and planning gates.

Record and preserve:

```yaml
execution_policy:
  preset: economy | standard | deep | custom
  policy_sources:
    base: explicit-user-task-instruction | repo-default | agent-default
    constraints: []
  model_profile: economy | balanced | frontier
  model_control: enforced | advisory
  reasoning_profile: low | medium | high
  reasoning_control: enforced | advisory
  max_subagents: unlimited | 0..64
  max_parallel: 0..10
  max_review_rounds: 0..2
  stop_after: <resolved named stage>
  budget_escalation: forbidden | ask
done_when:
  - <observable criterion with evidence>
```

Use `standard` when no explicit or repository policy exists. `standard` and `deep` default to `max_subagents: unlimited`; do not invent a numeric total-agent ceiling. Keep `max_parallel: 3` as a scheduling bound, so larger specialist sets run automatically in batches. A numeric total-agent ceiling is valid only when the user, an explicitly selected restrictive preset, or repository policy requests it. Apply platform constraints and repository restrictions by tightening fields; never expand a resolved ceiling automatically. Report advisory model or reasoning control honestly.

Do not set `maxTurns` or use a turn count as completion. Accept `completed` only after validating every `done_when` criterion and required evidence. Preserve `partial`, `blocked`, and `failed` results.

Only the main agent delegates. Count distinct child identities, bound concurrency, keep one writer per file or semantic contract, and prohibit nested delegation. A required independent review that does not fit an explicit numeric policy ends incomplete; do not weaken it. An unlimited identity budget should select all required specialists and schedule them in bounded parallel batches without asking for budget expansion.

Read:

- [references/policy.md](references/policy.md) for presets, precedence, profiles, and repository policy.
- [references/stops-and-delegation.md](references/stops-and-delegation.md) for stop ordering, response grammar, retry, compaction, and review-cycle semantics.
- [references/platform-capabilities.md](references/platform-capabilities.md) before making provider-specific enforcement claims.

Propagate the full execution state through task context, plans, compaction, task packets, continuations, reviews, and final handoff.
