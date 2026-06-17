# Testing, Performance, Observability, And Release

## Test Layers

Frontend:

- UI components, forms, adapter mocks, error mapping, store/query logic, routing

Rust:

- DTO validation, services, filesystem/path validation, migrations, parsers, error mapping, config loading, sidecar wrapper logic

Integration:

- command handler plus service plus persistence
- local DB migrations against previous fixtures
- secure storage adapter with mock/test backend
- sync worker with mock API
- sidecar lifecycle with test process

E2E/manual:

- real app launch, first run, login/logout, settings persistence, file import/export, offline mode, denied permission, long-operation cancellation, restart recovery, multi-window/tray/deep links, packaged smoke test

## Performance

Measure frontend and Rust separately.

- Keep bundles small, lazy-load heavy views, virtualize large lists, and verify packaged-build behavior.
- Move heavy CPU work to Rust but off the UI blocking path with appropriate async/blocking strategy.
- Avoid huge IPC JSON payloads; batch or stream progress.
- Track command duration, payload size, cache size, and event frequency.
- Dispose event listeners and resource handles.

## Observability

Log enough to debug user machines:

- app lifecycle, version, channel, OS, architecture
- command start/end/error with correlation IDs
- migrations, sync, network errors, updater, filesystem errors
- sidecar spawn/exit and sanitized stderr
- capability/permission denials

Do not log tokens, secrets, full request bodies, personal data, or raw imported file contents. Provide a redacted diagnostic bundle path when product support needs one.

## Release And CI

Minimum verification candidates:

```bash
pnpm lint
pnpm typecheck
pnpm test
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace --all-features
pnpm tauri build
```

Adjust commands to the repo's package manager and CI policy.

For release-impacting features, verify code signing, notarization where required, installer behavior, updater artifact signing, update metadata, checksums, local data migration, rollback, and smoke tests on target OSes.

## PR Handoff

Include:

- current tech context and pinned versions
- architecture boundary decisions
- command/event contracts
- capability/permission changes and reason
- storage/security decisions
- tests run and platform coverage
- packaged-build or manual QA gaps
