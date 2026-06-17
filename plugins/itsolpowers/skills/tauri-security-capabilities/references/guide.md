# Tauri Security Capabilities Reference Index

Use this index to choose focused hardening guidance. Do not load every file unless the task covers the full Tauri security posture.

## How To Use

1. Map the trust boundary: capabilities, command validation, filesystem/shell/process, secrets/session, CSP/remote content, or updater integrity.
2. Open the corresponding reference files.
3. For repo work, detect pinned Tauri and plugin versions first. For new apps, use latest stable. For capability semantics, command scopes, updater signatures, signing, and CSP behavior, verify official docs through `itsol-current-tech-context`.

## Reference Files

- `01-capabilities-permissions.md` - Tauri v2 capabilities, permissions, scopes, window/webview assignment, and least privilege review.
- `02-command-validation.md` - Rust command DTOs, validation, authorization, typed errors, event safety, and command-scope enforcement.
- `03-files-shell-secrets.md` - filesystem paths, shell/process/sidecar controls, local storage, secure storage, logs, and diagnostics.
- `04-csp-auth-updater-supply-chain.md` - CSP, remote content, deep links, auth/session, updater integrity, signing, and dependency gates.
