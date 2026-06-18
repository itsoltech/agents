# Agent Browser Interaction Debugging Reference Index

Use this routing index after reading `SKILL.md`. Load only the files needed for the current browser interaction issue.

## Reference Routing

- Fresh snapshots, short-lived `@eN` references, semantic locator choice, and concrete waits: read [01-snapshots-refs-waits.md](01-snapshots-refs-waits.md).
- Scroll, hidden elements, forms, modals, dialogs, popups, tabs, and iframes: read [02-forms-scroll-modals-tabs-iframes.md](02-forms-scroll-modals-tabs-iframes.md).
- Stale refs, blocked clicks, never-ending loading, expired sessions, flaky behavior, and product-vs-tooling classification: read [03-flaky-tooling-environment.md](03-flaky-tooling-environment.md).

## Command Policy

- Before command-sensitive work, check the installed command surface with `agent-browser --version` and `agent-browser --help`.
- If the installed CLI supports versioned local guidance such as `agent-browser skills get core` or `agent-browser skills get dogfood`, load it and prefer that output. Older versions may not provide those commands.
- Treat command snippets in these references as patterns. If installed CLI guidance differs, follow the local CLI guidance and preserve the interaction intent.
- Prefer evidence from visible UI behavior, snapshots, current URL, console, network, screenshots, and repeatable reproduction over assumptions from one command result.
