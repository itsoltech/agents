---
name: agent-browser-interaction-debugging
description: "Agent-browser interaction debugging: snapshots, short-lived element refs, semantic locators, waits, forms, scroll, modals, tabs, iframes, stale refs, blocked clicks, loading, session expiry, flaky behavior, and product-vs-tooling classification."
---

# Agent Browser Interaction Debugging

Debug local browser interactions by treating `agent-browser` as a user-facing inspection tool first and a command surface second. Use fresh evidence, current local CLI docs, and UI-visible behavior before classifying a failure.

## Process

1. Before actual interaction debugging command work, check the local command surface:
   - `agent-browser --version`
   - `agent-browser --help`
2. If the installed CLI supports versioned local guidance such as `agent-browser skills get core` or `agent-browser skills get dogfood`, load it and prefer that output when syntax differs. Older versions may not provide those commands.
3. Treat static command snippets in this skill as patterns, not permanent CLI truth.
4. Work from a fresh snapshot after navigation, rerender, modal open/close, tab switch, frame switch, filter, pagination, live event, optimistic update, form submit, or infinite-scroll page load.
5. Treat `@eN` refs as short-lived and bound to a specific snapshot, tab, and frame. Do not reuse a ref after the UI changes.
6. Prefer semantic locators by role, label, text, or stable test contract. Avoid generated CSS classes, incidental DOM position, and style-dependent selectors.
7. Wait for concrete user-visible or business results before judging behavior. Use fixed sleeps only for diagnostics, videos, or animation states that have no observable end condition.
8. Reproduce interactions through the UI. Do not use eval or DOM surgery to bypass overlays, validation, focus behavior, scroll behavior, or disabled states.
9. Classify findings clearly as product, test-script, tooling, environment, data, permissions, session, or external-service issues.
10. Read [references/guide.md](references/guide.md), then load only the focused reference files needed for the issue.

## Coordination

Use with `agent-browser-diagnostics-evidence` when console, network, HAR, trace, screenshots, videos, Web Vitals, or artifact redaction are in scope. Use with `agent-browser-qa-reporting` when turning reproduction evidence into QA handoff findings. Use framework-specific debugging skills after the browser evidence points to React, Svelte, routing, cache, auth, or API boundaries.
