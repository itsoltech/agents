# HAR Trace Profiler And Vitals

## Focused Artifact Windows

Start HAR, trace, profiler, or framework render recording only after the symptom is understood well enough to reproduce. Broad recordings create large artifacts, increase redaction work, and make analysis harder.

Good focused window:

1. Reset the app to a known state.
2. Start the artifact capture.
3. Perform only the relevant actions.
4. Leave the final state visible briefly.
5. Stop the capture immediately.
6. Record the artifact path, viewport, role, environment, and repro classification.

## HAR

Use HAR around a specific request-level reproduction. Pattern:

```bash
agent-browser --session "$SESSION" network har start
# perform the focused reproduction
agent-browser --session "$SESSION" network har stop "$OUT/har/issue-001.har"
```

HAR can include cookies, authorization headers, tokens, PII, request bodies, response bodies, and business data. Never share or commit raw HAR unless the user explicitly requested it and the file has been redacted or protected according to the project policy.

Prefer a safe report summary for normal handoff: endpoint shape, method, status, timing, correlation ID, retry pattern, and redacted payload excerpts.

## Trace And Profiler

Use trace and profiler after confirming the problem or when the task is explicitly performance-oriented. Patterns:

```bash
agent-browser --session "$SESSION" trace start
# perform the focused scenario
agent-browser --session "$SESSION" trace stop "$OUT/traces/issue-001-trace.zip"

agent-browser --session "$SESSION" profiler start
# perform the expensive interaction
agent-browser --session "$SESSION" profiler stop "$OUT/traces/issue-001-profile.json"
```

Trace is useful for navigation, rendering, layout, event, and network timing. Profiler is useful for CPU-heavy interactions, long tasks, jank, expensive rerenders, and slow input handling.

Do not use a trace or profiler file as the only evidence. Connect it to visible user impact such as delayed input, loader persistence, layout shift, animation jank, duplicate requests, or a frozen screen.

## Web Vitals And Performance Notes

Local vitals are synthetic measurements. They are useful for comparison and triage, but a single local measurement is not production field performance.

Patterns:

```bash
agent-browser --session "$SESSION" vitals "$TARGET_URL"
agent-browser --session "$SESSION" vitals "$TARGET_URL" --json > "$OUT/vitals.json"
```

Record measurement context:

- URL and route state
- viewport and device class
- browser/headed or headless mode
- build mode and environment
- network and CPU conditions when known
- warm or cold cache
- logged-in role and data volume

Core user-experience indicators include LCP, INP, and CLS. Also look for layout shifting during load, blocked input, animation jank, duplicate requests, excessive refetches, heavy images, endless loaders, long main-thread tasks, poor performance after opening modals, and large lists without virtualization.

Framework tooling can help diagnose render causes, but the finding should still be grounded in visible behavior and measured impact. Treat framework-specific commands as local CLI patterns and verify the installed command surface first.
