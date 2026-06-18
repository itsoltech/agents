# Agent Browser Dogfood Workflow Reference Index

Use this routing index after reading `SKILL.md`. Load only the file needed for the active dogfood phase.

## Reference Routing

- Session contract, charter, artifact layout, current CLI guidance, and safety boundaries: read [01-session-charter-setup.md](01-session-charter-setup.md).
- Black-box model, diagnostics boundary, core interaction loop, and dogfood phases 1-6: read [02-black-box-loop-user-flows.md](02-black-box-loop-user-flows.md).
- Responsive checks, accessibility checks, cache behavior, optimistic updates, and live events: read [03-viewports-accessibility-cache-live.md](03-viewports-accessibility-cache-live.md).

## Command Version Policy

- Before command work, run `agent-browser --version` and `agent-browser --help` to confirm the installed command surface.
- If the installed CLI supports versioned local guidance such as `agent-browser skills get core` or `agent-browser skills get dogfood`, load it and prefer that output when syntax, flags, output paths, or behavior differ. Older versions may not provide those commands.
- Treat command snippets here as patterns.
- Record the `agent-browser` version in session metadata and do not update the tool during an active session.
