# Packaged And Update Debugging

## Packaged-Only Failures

Check:

- preload, asset, database, migration, and worker paths inside or outside ASAR
- `process.resourcesPath`, `app.getAppPath()`, and `app.getPath('userData')` assumptions
- native modules rebuilt for target platform/arch
- dev-only dependencies imported by main/preload
- production endpoint config and absence of `localhost`
- disabled DevTools or remote debugging in production
- public source maps and error tracking upload behavior
- permissions of installed directories and user data directories

Use packaged-like tests when changing paths. A dev server can hide ASAR, preload, native module, and production config defects.

## Signing And Notarization

Check:

- macOS hardened runtime, entitlements, notarization status, and quarantine behavior
- Windows signing certificate, timestamp, SmartScreen reputation, and installer elevation needs
- Linux target format and sandbox/store constraints
- CI branch/tag rules controlling signing secrets
- whether fuses or ASAR integrity changed after signing

Do not place certificates, passwords, or signing material in repo files or diagnostic logs.

## Auto-Update Symptoms

Capture:

- provider/tooling: Electron `autoUpdater`, Electron Forge, electron-builder/electron-updater, store, or custom service
- current version, target version, channel, feed URL without tokens, platform, arch
- whether app is signed and notarized where required
- update metadata file, artifact availability, checksum, and publication order
- logs for check, download, verify, install, restart, and migration

Common causes:

- metadata published before artifact
- wrong channel or app ID
- unsigned or differently signed artifact
- expired or changed signing certificate
- proxy/VPN/TLS/captive portal interference
- app tries to update from a user-controlled or stale URL
- migration after update is non-idempotent
- restart occurs while user work is unsaved

Test update from N-1, N-2, and a realistic older version when storage migrations or updater configuration changed.
