# CI Gates, Smoke Tests, And Rollback

## CI Release Gates

- Install frontend dependencies with the detected package manager and lockfile.
- Run frontend lint, typecheck, and tests.
- Run `cargo fmt --all -- --check`.
- Run `cargo clippy --workspace --all-targets --all-features -- -D warnings` or the repo-equivalent lint gate.
- Run `cargo test --workspace --all-features` or the repo-equivalent test gate.
- Run dependency audit/license checks for Rust and JS where available.
- Build the frontend and Tauri app per target OS/architecture.
- Sign and notarize where required by the distribution path.
- Sign updater artifacts and publish checksums.
- Run packaged-app smoke tests before stable metadata is published.

## Platform Smoke Matrix

- Windows 10/11 standard user install and launch.
- macOS Intel and Apple Silicon launch, Gatekeeper/notarization, and update path.
- Linux target distro install or unpack, system dependencies, desktop integration, and launch.
- Fresh install.
- Upgrade install.
- Offline start.
- Login/logout and cache cleanup if auth exists.
- Primary file import/export if app supports files.
- Sidecar startup if used.
- Updater no-update and update-available paths.
- Logs contain version, OS, arch, channel, and no secrets.

## Rollout

- Publish internal first, then beta/canary, then stable.
- Monitor crash rate, startup failures, updater failures, install failures, migration errors, API errors, and support tickets.
- Keep stable promotion manual when release risk is high.
- Record exact artifacts and metadata changes for every promotion.

## Rollback

- Freeze the affected update channel.
- Restore previous metadata or publish a fixed forward version.
- Keep previous artifacts reachable.
- Define how to handle partially migrated local data.
- Provide recovery steps for corrupted local state, broken updater state, or failed installer state.
- Rotate signing or updater secrets if integrity is in question.

## Release Checklist

- Pinned versions recorded.
- Official docs checked for version-sensitive release/security behavior.
- Signing/notarization passed.
- Updater signatures verified.
- Checksums and release notes published.
- Stable metadata points to stable artifacts only.
- Packaged-app smoke tests passed per platform.
- Rollback owner and steps documented.
