# Regression Follow-Up

Use this reference when reporting fix verification, post-bug retest, release candidate validation, or follow-up after QA rejects a build.

## Retest Scope

Define retest scope before acting:

- original finding title, issue ID, or report reference
- expected fixed behavior
- build/deployment under retest
- original reproduction path
- impacted roles, viewports, browsers, and data states
- adjacent regression areas
- artifacts needed to prove closure
- known limitations or items intentionally deferred

Retest the original steps first. Then test the smallest adjacent area that could break because of the fix: shared components, validation, auth/session, permissions, cache, routing, persistence, API retries, error states, and live updates.

## Classification

- `fixed`: original issue no longer reproduces and closure evidence matches the expected behavior
- `partially-fixed`: original issue improved but a material part remains broken
- `not-fixed`: original issue still reproduces
- `new-regression`: new defect appears in adjacent or previously passing behavior after the fix
- `environment/tooling`: retest result is blocked or distorted by setup, data, deployment, or automation
- `needs-clarification`: expected behavior changed or acceptance criteria are not specific enough

Do not mark an issue fixed only because a command completed. Prove the user-visible behavior and record the environment.

## Proof Of Closure

Closure evidence should include:

- original steps rerun against the fixed build
- expected and actual fixed behavior
- artifact references from the retest run
- browser/device/viewport/role/data state
- notes on related checks that still passed
- remaining risks or deferred coverage

If the fix depends on cache invalidation, feature flags, background jobs, live events, or external services, record how that dependency was handled.

## When To Reopen

Reopen or keep the issue active when:

- original reproduction still fails on the target build
- only part of the user-visible behavior was fixed
- the fix works for one role, viewport, browser, or data state but fails for another in scope
- a new regression blocks the same workflow
- evidence is missing, contradictory, from the wrong deployment, or not shareable
- expected behavior changed without updated acceptance criteria

When reopening, attach the new retest evidence and say whether it is the same defect, a partial fix, or a new regression.

## Follow-Up Report Block

```markdown
## Regression follow-up

- Original issue:
- Retest build:
- Scope retested:
- Result: fixed / partially-fixed / not-fixed / new-regression / blocked
- Closure evidence:
- Adjacent checks:
- Remaining risks:
- Next action:
```
