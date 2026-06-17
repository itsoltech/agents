---
name: electron-desktop-implementation
description: "Electron desktop app implementation: architecture, main/preload/renderer boundaries, typed IPC contracts, BrowserWindow/session setup, storage, offline/API behavior, OS integrations, performance, packaging, and tests."
---

# Electron Desktop Implementation

Implement Electron desktop apps with explicit process boundaries, narrow preload APIs, validated IPC, hardened windows and sessions, deliberate storage/API choices, and verification that includes packaged-app behavior.

## Process

1. Inspect repo conventions, `.itsol.md`, package manager, Electron/builder versions, frontend framework, existing `main`/`preload`/`renderer` layout, test commands, packaging target, and release channel.
2. For existing repos, use the repo-pinned Electron and tooling versions unless the task includes an approved upgrade. For new projects, use latest stable Electron and current stable tooling.
3. Use `itsol-current-tech-context` for Electron, Electron Forge, electron-builder, WebdriverIO, Playwright Electron, signing, auto-update, or version decisions that depend on current official docs.
4. Read [references/guide.md](references/guide.md), then load only the focused reference files needed for the implementation area.
5. Decide the smallest architecture that matches the product: single-window MVP, modular medium app, or workspace/monorepo for large multi-window/offline apps.
6. Keep renderer as web UI, preload as a narrow typed bridge, main as system/lifecycle/OS boundary, and utility processes/workers for CPU-heavy or crash-prone work.
7. Define IPC contracts, storage ownership, error handling, logout/tenant cleanup, offline behavior, and QA scenarios before editing broad cross-process behavior.
8. Verify with the repo's typecheck, lint, unit/integration tests, build/package command, and a packaged-app smoke test when the change touches preload paths, storage, signing, updater, native modules, or production flags.

## Coordination

Use with `itsol-current-tech-context`, `itsol-tdd-workflow`, `security-frontend-browser-review`, `security-files-integrations-review`, `security-secrets-config-review`, `ui-frontend-testing-qa`, `ui-accessibility-motion`, and framework-specific frontend skills as relevant.
