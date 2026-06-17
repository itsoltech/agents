---
name: tauri-security-capabilities
description: "Tauri security: v2 capabilities, permissions, command validation, filesystem/shell scopes, secrets, CSP, updater integrity."
---

# Tauri Security Capabilities

Harden Tauri by narrowing each trust boundary between the WebView frontend, Rust core, OS APIs, local files, process execution, secrets, and update infrastructure.

## Process

1. Identify the trust model: windows/webviews, local UI, any remote content, capabilities, permissions, custom commands, plugin scopes, filesystem, shell/process, sidecars, secrets, auth/session, CSP, deep links, and updater.
2. For an existing repo, detect pinned Tauri, plugins, Rust, npm/package-manager, and frontend versions before relying on defaults. For a new project, use latest stable. For security-sensitive defaults, capability semantics, command scopes, updater signatures, signing, or CSP behavior, verify official docs through `itsol-current-tech-context`.
3. Read [references/guide.md](references/guide.md) and load only the hardening reference files for the affected surface.
4. Implement controls at the trusted boundary: capability files, permission scopes, Rust command validation, storage adapters, CSP, release config, and CI gates.
5. Add negative tests or review evidence for bypasses: bad window/webview access, malformed payloads, path traversal, symlink escape, untrusted deep links, remote content, tampered updates, and leaked secrets.
6. Do not rely on frontend-only checks, obscurity, bundled asset secrecy, user-controlled URLs, or UI-disabled controls for security decisions.

## Baseline

Production Tauri apps should use per-window capabilities, minimal permissions, scoped plugin access, typed and validated Rust commands, restrictive CSP, secure secret storage, controlled deep links, signed sidecars where applicable, signed update artifacts, dependency checks, and packaged-app security smoke tests.
