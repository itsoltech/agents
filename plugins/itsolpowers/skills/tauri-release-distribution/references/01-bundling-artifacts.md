# Bundling And Artifacts

## Inputs To Inspect

- `src-tauri/tauri.conf.*`
- `src-tauri/Cargo.toml`, `Cargo.lock`, `rust-toolchain.toml`
- package manager lockfile and frontend build scripts
- Tauri plugin config
- capabilities included in production
- CI build matrix
- sidecar, icon, asset, and resource configuration

## App Identity

- Keep application identifier, app name, publisher, bundle ID, and data paths stable across releases.
- Use separate identity, app name, channel, or storage for internal/beta builds if they can be installed beside stable.
- Changing app identity can make the OS treat the release as a new app and can orphan local data or updater state.
- Version should be updated through one controlled release process.

## Artifact Matrix

- Windows: decide installer type, architecture, signing, SmartScreen expectations, admin requirements, and enterprise install needs.
- macOS: decide DMG/App Store/direct download, Intel/Apple Silicon/universal, code signing, hardened runtime, and notarization.
- Linux: decide AppImage, deb, rpm, Snap, distro dependencies, desktop integration, and target distro support.
- Mobile targets should be explicit if they are in scope; do not assume desktop release checks cover them.

## Package Contents

- Verify frontend assets, icons, sidecars, migrations, schemas, license files, and native resources are included.
- Exclude test fixtures, dev configs, internal docs, sample secrets, and debug-only assets.
- Source maps should be intentionally private, absent, or uploaded to approved error tracking.
- Packaged app must run without the frontend dev server.

## Sidecars

- Package sidecars per target OS/architecture.
- Decide whether sidecars update with the app.
- Verify sidecar signatures or checksums when integrity matters.
- Smoke-test sidecar spawn, permissions, working directory, stdout/stderr, crash handling, and shutdown after packaging.
