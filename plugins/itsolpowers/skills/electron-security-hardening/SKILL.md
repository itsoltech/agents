---
name: electron-security-hardening
description: "Harden Electron desktop apps: BrowserWindow webPreferences, contextIsolation, sandbox, CSP, permission handlers, navigation and new-window controls, IPC sender and payload validation, custom protocols, file access, secret storage, fuses, ASAR integrity, and update integrity. Use when implementing or reviewing Electron security controls."
---

# Electron Security Hardening

Harden Electron by narrowing every trust boundary between Chromium, Node.js, the OS, local files, and update infrastructure.

## Process

1. Identify the app trust model: local UI, remote content, preload APIs, IPC handlers, sessions, custom protocols, file access, secrets, and updater.
2. For an existing repo, detect the pinned Electron version and tooling before relying on defaults. For a new project, use latest stable. For security-sensitive defaults, fuses, protocol privileges, signing, or update validation, verify official docs through `itsol-current-tech-context`.
3. Read [references/guide.md](references/guide.md) and load only the hardening reference files for the affected surface.
4. Implement controls at the trusted boundary: main process, session, protocol handler, preload contract, IPC handler, package/build config, and CI release gate.
5. Add negative tests or review evidence for bypasses: XSS payloads, bad origins, `javascript:`/`file:` URLs, untrusted sender frames, path traversal, symlink escape, stale sessions, and tampered updates.
6. Do not rely on renderer-only checks, obfuscation, ASAR secrecy, or user-controlled URLs for security decisions.

## Baseline

Production windows should have `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `webSecurity: true`, `allowRunningInsecureContent: false`, controlled DevTools, CSP, explicit navigation policy, permission handlers, typed preload APIs, sender-aware IPC, signed releases, and update integrity.
