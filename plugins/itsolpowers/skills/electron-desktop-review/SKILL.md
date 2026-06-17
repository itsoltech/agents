---
name: electron-desktop-review
description: "PR review Electron apps: architecture, process boundaries, preload and IPC contracts, security posture, storage, API/networking, auto-update, tests, QA, and release risk. Use when reviewing Electron desktop application changes, Electron app architecture, desktop-specific security-sensitive code, or packaged-app behavior."
---

# Electron Desktop Review

Review Electron as a desktop system, not only as a frontend diff. A renderer XSS, broad preload bridge, unsafe file path, or broken updater can become a local compromise or failed rollout.

## Process

1. Inspect changed files, dependency pins, package scripts, builder config, window creation, preload, IPC handlers, storage, network calls, updater code, tests, and release notes.
2. For an existing repo, detect the repo-pinned Electron and packaging tool versions before judging APIs or defaults. For a new project, use latest stable. For version, security, signing, updater, or platform behavior decisions, verify official docs through `itsol-current-tech-context`.
3. Read [references/guide.md](references/guide.md) and then load only the reference files matching the changed surface.
4. Build a review coverage map: architecture boundaries, IPC contracts, security hardening, storage/secrets, API/network/offline behavior, auto-update/release impact, tests, and QA evidence.
5. Lead with findings by severity, with concrete exploit, data-loss, rollout, or user-impact scenarios and file references.
6. Treat missing packaged-app smoke tests, unsigned release paths, unvalidated IPC, renderer access to Node/Electron, and untested storage migrations as explicit review risks.

## Evidence

Prefer code, tests, config, lockfiles, CI logs, packaged-app behavior, and official Electron/tooling docs over assumptions.
