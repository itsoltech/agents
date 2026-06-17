---
name: electron-release-distribution
description: "Plan or review Electron release and distribution: packaging, electron-vite, Electron Forge, electron-builder, code signing, macOS notarization, update channels, auto-update metadata, CI release gates, platform smoke tests, rollback, and installer QA. Use when implementing, debugging, or reviewing Electron build and release pipelines."
---

# Electron Release Distribution

Release Electron as a signed, updateable, platform-specific product. Packaging decisions affect security, updater behavior, installer trust, artifact size, CI cost, and rollback.

## Process

1. Inspect the repo's Electron, package manager, builder, signing, notarization, auto-update, CI, release branch/tag policy, and smoke-test evidence.
2. For an existing repo, detect pinned Electron and packaging tool versions. For a new project, use latest stable. For signing, notarization, updater metadata, platform targets, or security defaults, verify official docs through `itsol-current-tech-context`.
3. Read [references/guide.md](references/guide.md), then load the reference files matching the release decision or failure.
4. Choose packaging and distribution from product constraints: install targets, stores, update server, native modules, enterprise environment, and support burden.
5. Gate release with typecheck, lint, unit/integration tests, packaged-app smoke tests per platform, signing/notarization checks, artifact checksums, and updater channel validation.
6. Plan rollback before release: previous version availability, update-channel freeze, metadata rollback, storage migration compatibility, and user data recovery.

## Output

For plans, produce decisions, required secrets, CI gates, platform matrix, smoke tests, release notes requirements, rollback steps, and residual risks. For reviews, lead with blockers that could ship unsigned, unnotarized, unupdateable, unsafe, or untestable artifacts.
