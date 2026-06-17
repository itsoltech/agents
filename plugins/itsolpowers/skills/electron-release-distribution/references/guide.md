# Electron Release Distribution Reference Index

Use this index to choose focused release guidance. Load only the files matching the release decision, pipeline change, or failure under investigation.

## How To Use

1. Detect repo-pinned Electron, Node, package manager, builder, and updater versions for existing apps. For new projects, use latest stable.
2. For signing, notarization, updater, target, or platform behavior decisions, verify official docs through `itsol-current-tech-context`.
3. Open the relevant reference files below.

## Reference Files

- `01-tooling-packaging-decisions.md` - electron-vite, Forge, builder, targets, native modules, ASAR, source maps, and artifact contents.
- `02-signing-notarization-artifacts.md` - Windows/macOS/Linux signing, notarization, secrets, checksums, SBOM, and reproducibility.
- `03-auto-update-channels.md` - updater choices, channels, metadata, migrations, restart UX, and update QA.
- `04-ci-smoke-rollback.md` - CI release gates, platform smoke tests, rollout, rollback, and release checklist.
