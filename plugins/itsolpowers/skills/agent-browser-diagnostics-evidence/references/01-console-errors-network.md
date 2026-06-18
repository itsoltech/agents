# Console Errors And Network

## Console And Page Errors

For a focused reproduction, start from a clean diagnostic window when the local CLI supports it. Pattern:

```bash
agent-browser --session "$SESSION" console --clear
agent-browser --session "$SESSION" errors --clear
```

Run the user scenario, then capture both human-readable and structured output when available:

```bash
agent-browser --session "$SESSION" console
agent-browser --session "$SESSION" console --json > "$OUT/console/issue-001-console.json"
agent-browser --session "$SESSION" errors
```

Inspect console and page errors for:

- uncaught exceptions and unhandled promise rejections
- hydration, boundary, serialization, parsing, dynamic import, and chunk loading failures
- repeated warnings created by the tested interaction
- CSP, CORS, mixed-content, WebSocket, Service Worker, and third-party source errors
- render loops, unmounted component updates, or visible instability after the action

Do not treat every console line as a product bug. For each relevant entry, record whether it existed before the repro, whether it came from the app or a third party, whether it correlates with the user action, whether it affects the user, whether it repeats, and whether it contains sensitive data.

Console-only issues can still matter when they imply data loss, inconsistent state, security exposure, or likely future instability. Deprecation warnings and unrelated third-party noise usually belong in a lower-severity technical observation unless user-visible behavior is affected.

## Network Requests

Use request views to narrow diagnostics to the action. Patterns:

```bash
agent-browser --session "$SESSION" network requests
agent-browser --session "$SESSION" network requests --type xhr,fetch
agent-browser --session "$SESSION" network requests --method POST
agent-browser --session "$SESSION" network requests --status 4xx
agent-browser --session "$SESSION" network requests --status 5xx
agent-browser --session "$SESSION" network request "$REQUEST_ID"
```

For a finding, collect:

- URL with secrets removed
- method and status
- request ID, correlation ID, or trace ID when present
- timing relative to the user action
- cancellation or retry behavior
- safe fragments of request and response payloads
- repeat count and duplicate request pattern
- related UI message, loader, toast, or silent failure
- result after retry or reload

Interpret status codes in context. A 400 can be valid validation, 401 can be expected after logout, 403 can be correct authorization enforcement, 404 can be correct for a removed resource, and an abort can be caused by navigation or cancellation.

Report a network defect when the status conflicts with the scenario, the UI handles it incorrectly, the request is duplicated, the user sees a silent failure, retries corrupt state, or data remains inconsistent.

## Correlation Discipline

Tie diagnostics to the user-visible symptom:

- action performed
- expected result
- actual result
- console or page error time
- request time, status, and payload summary
- screenshot or video frame showing the outcome

Keep facts separate from hypotheses. Example fact: "POST /orders returned 500 after Save and the form stayed enabled without an error message." Example hypothesis: "The save handler may not surface server errors."
