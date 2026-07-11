---
name: electron-desktop-debugging
description: "Electron desktop app debugging: main/preload/renderer evidence, IPC failures, BrowserWindow/session issues, packaged app bugs, auto-update symptoms, logs, crashes, performance, and memory leaks."
---

# Electron Desktop Debugging

For bugfix authorization and plan prerequisites, defer to `itsol-workflow-mode`; retain evidence, root-cause analysis, TDD/replacement verification, and final review in every mode.

Debug Electron failures by first locating the failing boundary: main process, preload bridge, renderer UI, IPC contract, session/window setup, storage/API layer, packaged artifact, updater, OS integration, or performance/memory behavior.

## Process

1. State expected behavior, actual behavior, impact, platform, architecture, app version, channel, packaged/dev mode, Electron version, and the smallest reproducible symptom.
2. Inspect repo-pinned Electron and tooling versions for existing repos. For new-project advice or upgrade-sensitive fixes, use latest stable only after checking official docs through `itsol-current-tech-context`.
3. Gather evidence before changing code: main logs, renderer console, preload exposure, IPC channel/payload shape, network/session state, storage paths, updater logs, crash dumps, test output, and packaged-app behavior.
4. Read [references/guide.md](references/guide.md), then load the focused debugging reference for the suspected boundary.
5. Reproduce in the mode that fails. If production fails, do not trust dev server behavior alone; package or run a packaged-like build with isolated `userData`.
6. Fix one boundary at a time and add a regression test when repo policy supports it. For missing test infrastructure, document replacement verification and run the narrowest reliable smoke test.
7. Use `itsol-bug-debugging` for user-facing defects and follow its Technical Fix Plan gate when required by the resolved workflow mode.

## Coordination

Use with `itsol-current-tech-context`, `itsol-bug-debugging`, `itsol-tdd-workflow`, `security-frontend-browser-review`, `security-files-integrations-review`, `infra-observability`, `ui-performance-stability`, and the frontend framework debugging skill used by the renderer.
