# Electron Security Hardening Reference Index

Use this index to choose focused hardening guidance. Do not load every file unless the task covers the full Electron security posture.

## How To Use

1. Map the trust boundary: window/session, preload/IPC, navigation/protocol, files/secrets, packaging/update.
2. Open the corresponding reference files.
3. For repo work, detect pinned Electron and builder versions first. For new apps, use latest stable. For security defaults, fuses, signing, updater behavior, and protocol privileges, verify official docs through `itsol-current-tech-context`.

## Reference Files

- `01-window-session-csp.md` - BrowserWindow defaults, sessions, permissions, CSP, and remote content.
- `02-navigation-protocols.md` - navigation, new windows, external links, deep links, and custom protocol handling.
- `03-ipc-preload-validation.md` - preload API design, IPC schema validation, sender checks, events, and streams.
- `04-files-secrets-storage.md` - file access, path validation, symlinks, storage, secrets, logs, and crash reports.
- `05-build-update-integrity.md` - fuses, ASAR integrity, signing, notarization, update integrity, and release gates.
