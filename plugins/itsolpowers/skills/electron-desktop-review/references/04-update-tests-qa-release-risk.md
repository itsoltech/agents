# Update, Tests, QA, And Release Risk

## Auto-Update Review

- Production builds are signed; macOS builds are notarized.
- Update channels are explicit: internal, beta, stable, or repo-specific equivalents.
- Update metadata and artifacts publish atomically over HTTPS.
- Users cannot control update URLs.
- The updater verifies signatures or the selected tool's integrity mechanism.
- Restart behavior protects unsaved work.
- Storage migrations after update are idempotent and tested from old versions.

## Packaging Review

- Main, preload, and renderer are built separately.
- Dev-only files, fixtures, test data, public sourcemaps, and unused assets are not shipped unless intentionally required.
- Native modules rebuild in CI for each target platform and architecture.
- Electron, Node, package manager, lockfile, and builder versions are pinned for existing apps.
- Artifact size, ASAR contents, installer targets, and checksums are reviewed.

## Test Coverage

- Unit tests cover validators, path checks, update channel resolver, retry policy, DTO mapping, and migration logic.
- Integration tests cover IPC handler + service + storage, custom protocol handlers, permission decisions, deep links, file import/export, logout cleanup, and crash-safe writes.
- E2E or packaged smoke tests cover first run, login/logout, main flow, window lifecycle, import/export, offline/online, mocked updater flow, permissions, and keyboard navigation.
- Platform smoke tests cover Windows, macOS, and Linux when release targets include them.

## QA Edge Cases

- Fresh install and install over older profile.
- No internet, corporate proxy, VPN, captive portal, TLS errors, DNS failure.
- Limited permissions, antivirus interference, no disk space.
- User paths with spaces, Unicode, and locale-specific characters.
- Multi-monitor, DPI scaling, sleep/wake, dark/high-contrast modes.
- Files deleted, moved, read-only, symlinked, large, wrong extension, or cloud-synced.
- Security payloads in API data, filenames, deep links, external URLs, and IPC payloads.

## Release Blockers

- Unsigned or unnotarized production artifacts where platform expectations require them.
- No packaged-app smoke test before release.
- Updater metadata can point to missing or wrong-channel artifacts.
- No rollback plan for failed update or broken migration.
- Electron security posture depends on dev-only assumptions.
