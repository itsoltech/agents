# Snapshots, Refs, Locators, And Waits

## Snapshot Discipline

Use a full snapshot to understand page content and an interactive snapshot to choose actionable elements. Interactive snapshots may omit non-interactive text, so absence from an interactive view does not prove the text is missing.

Pattern:

```bash
agent-browser --session "$SESSION" snapshot
agent-browser --session "$SESSION" snapshot -i --json
```

Take a new snapshot after:

- navigation or URL change
- form submit
- modal, dialog, or popup open/close
- filter, pagination, sort, or infinite-scroll page load
- list rerender, optimistic update, live event, or polling refresh
- tab or frame switch
- role, permission, feature-flag, or data-state change

## `@eN` References

Treat each `@eN` ref as scoped to one snapshot, tab, and frame. After the UI changes, assume the ref is stale even if the number still appears plausible.

Element selection order:

1. Fresh ref from the latest relevant snapshot.
2. Semantic locator by role, accessible name, label, or exact text.
3. Stable test contract such as `data-testid`.
4. Stable CSS selector tied to product structure, not generated styling.
5. JavaScript only for diagnostics, never to bypass the UI flow.

Avoid generated CSS classes, random `div` indexes, and selectors that depend on styling or layout implementation.

## Semantic Locator Patterns

Use these as intent examples after confirming current local syntax:

```bash
agent-browser --session "$SESSION" find role button click --name "Save"
agent-browser --session "$SESSION" find label "Email" fill "qa@example.com"
agent-browser --session "$SESSION" find text "Settings" click --exact
agent-browser --session "$SESSION" find testid "order-submit" click
```

When a semantic locator finds multiple matches, narrow by region, dialog, row text, or visible state instead of guessing by order.

## Concrete Waits

Wait for the result that proves the interaction succeeded or failed. Preferred order:

1. Expected element, text, status, or data row.
2. URL or route change.
3. Loader or busy state disappearing.
4. Specific diagnostic JavaScript condition.
5. Network idle only when the app does not keep long-running channels open.
6. Fixed timeout only as a documented fallback.

Pattern:

```bash
agent-browser --session "$SESSION" wait --text "Saved successfully"
agent-browser --session "$SESSION" wait --url "**/orders/*"
agent-browser --session "$SESSION" wait "#loading-spinner" --state hidden
agent-browser --session "$SESSION" wait --fn "window.appReady === true"
```

Avoid waiting forever for network idle in apps that use WebSockets, SSE, polling, analytics, telemetry, or long-running requests. In those apps, wait for a business result such as saved state, visible route content, item count, empty state, error banner, or retry control.

Fixed sleeps are acceptable for diagnostics, readable video capture, animation without observable completion, or a clearly documented limitation. Do not make fixed sleeps the main synchronization strategy.
