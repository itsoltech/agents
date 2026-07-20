# Review profiles and automatic re-review

The Pi extension resolves review behavior from `.itsol.md`, the active task context, an optional `/itsol-review profile ...` override, and the execution-policy ceiling. The extension-managed result is authoritative; do not recreate this resolution in the agent prompt.

## Profiles

| Profile | Default trigger | Delegation | Automatic re-review | Profile round cap |
|---|---|---|---|---:|
| `off` | `manual` | `never` | `never` | 0 |
| `poc` | `final` | `never` | `never` | 1 |
| `balanced` | `adaptive` | `risk-based` | `never` | 1 |
| `strict` | `final` | `risk-based` | `until-approved` | 2 |

Explicit `review` fields override profile defaults. For implementation/code review, the effective round cap is the smaller of `review.max_rounds` and `execution.max_review_rounds`. Plan Rubber Duck loops are independent and use `review.plan_max_rounds` (default 2 per artifact). Under `adaptive`, the main agent owns the run/skip and inline/specialist decision. If strict or explicitly selected specialist coverage does not fit execution ceilings, report the real gap instead of silently weakening it.

## Repository configuration

```yaml
review:
  default_profile: balanced
  trigger: adaptive
  delegation: risk-based
  auto_rereview: never
  max_rounds: 1
  plan_max_rounds: 2
  allowed_profiles: [off, poc, balanced, strict]
  restrictions:
    - match:
        path: src/payments
      profile: strict
      allowed_profiles: [balanced, strict]
      auto_rereview: until-approved
```

Local `.itsol.md` files and matching restrictions can narrow allowed profiles or replace behavior for a path or operation. A task override cannot select a profile outside effective `allowed_profiles`.

## Trigger semantics

- `manual`: run review only after an explicit user request.
- `adaptive`: the main agent decides whether formal review adds value and chooses inline or specialist depth proportionally.
- `final`: run once before managed completion, not after each edit.
- `checkpoint`: permits configured checkpoint review and still requires a current final verdict.

`profile=off`, `trigger=manual`, `trigger=adaptive` with an agent skip decision, or an effective round cap of zero must not create surprise review work.

## Re-review state machine

1. Save the review-plan diff fingerprint and round number.
2. Consolidate one verdict for that exact plan and increment the round once. Reviewer count and delegation batches do not increment rounds.
3. On `approve`, proceed only while the current diff fingerprint still matches.
4. On `changes-requested`, wait for actual fixes.
5. Signal automatic re-review only when the diff fingerprint changes and another round is available.
6. `after-fixes` allows the bounded follow-up round; `until-approved` repeats only up to the same hard cap.
7. Never rerun for an unchanged diff, for `Nit`, `Suggestion`, style, optional refactors, or speculative concerns, or after the cap.
8. If blockers remain at the cap, stop honestly as partial or blocked; do not manufacture approval.

Changing code after approval makes the verdict stale and requires a fresh plan when review is required by the effective policy.
