# Tauri Release Distribution Reference Index

Use this index to choose focused release guidance. Load only the files matching the release decision, pipeline change, or failure under investigation.

## How To Use

1. Detect repo-pinned Tauri, Rust toolchain, package manager, frontend framework, plugins, and updater versions for existing apps. For new projects, use latest stable.
2. For signing, notarization, updater signatures, target artifacts, platform behavior, or release security decisions, verify official docs through `itsol-current-tech-context`.
3. Open the relevant reference files below.

## Reference Files

- `01-bundling-artifacts.md` - Tauri bundling config, app identity, target artifacts, sidecars, assets, source maps, and platform package decisions.
- `02-signing-notarization-secrets.md` - Windows/macOS/Linux signing, notarization, private keys, certificates, checksums, SBOM, and reproducibility.
- `03-updater-signatures-channels.md` - Tauri updater signatures, public/private keys, metadata, channels, staged rollout, migrations, and update QA.
- `04-ci-smoke-rollback.md` - CI release gates, platform smoke matrix, rollout, rollback, and release checklist.
