# Screenshots Videos And Redaction

## Static Evidence

For text clipping, visual defects, incorrect copy, missing state, or a problem visible immediately on page load, a single annotated screenshot may be enough. Pattern:

```bash
agent-browser --session "$SESSION" screenshot --annotate "$OUT/screenshots/issue-001.png"
```

The screenshot should include enough page context to understand the issue without guessing. Record URL or route shape, viewport, role, environment, and data state separately if the screenshot must hide sensitive details.

## Interactive Evidence

For action-dependent behavior, capture the path into the issue and the final state. Pattern:

```bash
agent-browser --session "$SESSION" record start "$OUT/videos/issue-001-repro.webm"
agent-browser --session "$SESSION" screenshot "$OUT/screenshots/issue-001-step-1.png"
# perform the user action at a human-readable pace
agent-browser --session "$SESSION" screenshot "$OUT/screenshots/issue-001-step-2.png"
agent-browser --session "$SESSION" screenshot --annotate "$OUT/screenshots/issue-001-result.png"
agent-browser --session "$SESSION" record stop
```

Use a pace a reviewer can follow. When the video must show keyboard behavior, prefer real typing where supported. Outside video capture, faster fill-style commands may be acceptable after checking local CLI guidance.

Every written reproduction step should map to the relevant screenshot, video timestamp, console entry, or request observation.

## Redaction Rules

Redact before sharing, committing, or pasting artifact content:

- cookies and auth state
- tokens, API keys, passwords, and authorization headers
- PII and customer data
- internal IDs when they identify protected business data
- sensitive query strings, callback URLs, and deep links
- request and response bodies that expose private data
- screenshots or videos showing secret fields, account data, billing, messages, or tenant data

Prefer redacted copies for collaboration and keep raw artifacts protected according to the task policy. If redaction would change the meaning of a visual artifact, state the limitation instead of silently altering the evidence.

## Quality Checklist

Good evidence:

- comes from the exact run described in the finding
- starts before the action that triggers the problem
- leaves the final state visible long enough to inspect
- uses stable names such as `issue-001-console.json`, `issue-001-repro.webm`, or `issue-001-result.png`
- shows the whole needed context without unrelated sensitive content
- avoids edits that change meaning
- stores raw console and network output separately from the narrative report
- records redaction status and any missing artifact explicitly

Bad evidence:

- artifact from a different run
- cropped screenshot hiding the relevant state
- video that starts after the failure
- raw HAR or logs pasted into the report with secrets
- screenshot of a secret field or private record
- report that mixes observed facts with root-cause guesses

## Facts And Hypotheses

Write facts first:

- what the user did
- what should have happened
- what happened instead
- which artifacts prove it
- whether the issue is confirmed, intermittent, observation-only, blocked, tooling/environment, or requirement ambiguity

Then write hypotheses separately with confidence and missing evidence. Do not overclaim a root cause from a screenshot, console line, or single request unless the artifact proves it.
