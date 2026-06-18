# Flaky Behavior, Tooling, And Environment Classification

## Stale Or Invalid References

Suspect a stale ref when the tool reports a missing ref, clicks a different element, an action has no effect, the element existed before rerender, or the action lands on the wrong list item.

Recovery:

```bash
agent-browser --session "$SESSION" get url
agent-browser --session "$SESSION" snapshot -i --json
```

Then choose a new ref or semantic locator. Do not retry the same stale ref repeatedly.

After tab or frame changes, explicitly switch context and snapshot before interacting:

```bash
agent-browser --session "$SESSION" tab
agent-browser --session "$SESSION" tab t2
agent-browser --session "$SESSION" snapshot -i
```

## Blocked Clicks

When a click is blocked, gather annotated visual evidence, identify the blocking UI, close or handle it through normal user behavior, snapshot again, and retry with a fresh ref.

Pattern:

```bash
agent-browser --session "$SESSION" screenshot --annotate "$OUT/screenshots/click-blocked.png"
agent-browser --session "$SESSION" snapshot -i
```

Likely blockers include cookie banners, toasts, tooltips, onboarding layers, backdrops, sticky headers, disabled states, and modals. Do not use eval to remove a blocking element from the DOM. That can hide a real UX bug.

## Never-Ending Loading

Do not wait indefinitely for network idle. Inspect UI, console, page errors, and request state.

Pattern:

```bash
agent-browser --session "$SESSION" snapshot
agent-browser --session "$SESSION" console
agent-browser --session "$SESSION" errors
agent-browser --session "$SESSION" network requests --type xhr,fetch
```

Determine whether:

- the loader is expected to finish
- a request remains pending
- the app uses WebSockets, SSE, polling, analytics, or telemetry
- a silent error occurred
- state was saved despite the loader
- retry, cancel, empty, or error UI is available

Wait for a business result where possible, such as visible route content, a saved banner, updated row, retry button, or error message.

## Expired Session

Signs include redirect to login, 401 or 403 responses, empty data, repeated retry, expiry modal, or requests running under the wrong visible user.

Check current URL, visible account identity, cookie presence without printing values, console, auth-related network responses, behavior after re-login, return-to-route behavior, and whether previous-session cache clears.

Do not save or reuse a new auth state until the visible user and role are confirmed.

## Flaky Behavior Protocol

For irregular behavior:

1. Define reset steps and starting state.
2. Run controlled attempts without changing multiple variables at once.
3. Record result, duration, relevant request, viewport, role, data state, and notes.
4. Start stronger evidence capture after the first repeat.
5. Report frequency, such as `3/10`, instead of calling it deterministic.
6. Check correlation with latency, viewport, action order, live events, cache, feature flags, and external services.

Attempt table:

| Attempt | Result | Time | Request | Notes |
|---|---|---:|---|---|
| 1 | pass | 820 ms | 200 | baseline |
| 2 | fail | 4.2 s | 200 | list did not update |
| 3 | pass | 910 ms | 200 |  |

## Product Vs Tooling Classification

Ask these questions before filing:

- Is the expected result defined by a requirement, product pattern, or accessible UI convention?
- Was the correct user, role, data state, environment, and feature flag used?
- Did the ref come from a fresh snapshot in the active tab and frame?
- Did the wait target the actual user-visible result?
- Does the issue reproduce after reload, in a new session, or in headed mode?
- Is the problem visible without eval, DOM edits, or mocks?
- Do console, page errors, or network evidence support the anomaly?
- Could an unavailable external service, stale data, permissions, or expired session explain it?
- Can another user reproduce it from the recorded preconditions and steps?

Do not dismiss real product problems as tooling only because they are intermittent. Do not report a tooling or setup issue as a product defect only because a command failed.

## Rubber-Duck Questions

Before action:

- What exact result should become visible?
- What UI state should change?
- Does the action save data or only change view state?
- Is the action destructive?
- Which user, role, request, and persistence checks matter?

After action:

- Is the result visible and durable after reload when durability is expected?
- Are list and detail views consistent?
- Did console or network show unexpected errors?
- Did the request happen once and return the expected status?
- Did loading, disabled state, and focus behave logically?
- Do I have a fresh snapshot?

Before reporting:

- Can I reproduce the problem and describe preconditions?
- Is expected behavior grounded in requirements or established app behavior?
- What is user impact and frequency?
- Is severity calibrated?
- Are artifacts free of secrets?
- Can another tester reproduce without my private context?
- Did I separate observed facts from technical hypotheses?
