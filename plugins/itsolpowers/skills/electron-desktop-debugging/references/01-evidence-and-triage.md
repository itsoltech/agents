# Evidence And Triage

## Initial Facts

Capture:

- expected vs actual behavior
- first known bad version and last known good version
- dev, test, packaged, signed, notarized, store, or update-installed mode
- platform, OS version, architecture, display scaling, GPU status when relevant
- Electron version and builder/updater/test-runner versions from repo pins
- app version, commit, channel, user/tenant/project, and environment
- reproduction steps and whether the issue survives app restart and clean `userData`

## Evidence Matrix

- Main process: terminal output, app log file, lifecycle events, window creation, IPC timing, updater/storage logs.
- Preload: exposed API shape, preload path resolution, context isolation, listener cleanup, missing bridge methods.
- Renderer: DevTools console, network panel, framework errors, CSP/security warnings, UI state, query cache.
- IPC: channel name, request schema, sender window, authorization check, timeout/cancellation, response/error mapping.
- Session/window: cookies, cache, permission handler decisions, `will-navigate`, `window.open`, CSP, custom protocol.
- Storage/API: `userData` path, schema version, migrations, corrupted config, proxy/VPN/TLS/network failures.
- Packaged app: ASAR paths, native modules, dev-only imports, code signing, notarization, production endpoint config.

## Reproduction Rules

- Reproduce where the failure occurs; do not rely on dev server behavior for packaged-only bugs.
- Use isolated temporary `userData` for destructive or migration repros.
- Test clean install and existing-profile upgrade separately.
- Disable HMR assumptions when checking lifecycle bugs.
- Keep one variable changed at a time: mode, userData, platform, version, channel, or network condition.

## Fix Discipline

State the suspected boundary before editing. A good fix changes the failing boundary and adds a regression check or documented replacement verification.
