# Expo React Native Review Reference Index

Use this index to choose focused review guidance. Do not load every reference unless the pull request spans the full Expo mobile surface.

## How To Use

1. Identify changed surfaces: architecture, dependency pins, generated/native config, API/cache/offline, storage, UI/platform behavior, security, EAS build/update/release, tests, or QA.
2. Open only the reference files that match those surfaces.
3. For repo work, detect pinned Expo SDK, React Native, React, Expo Router, EAS CLI, Node, package manager, and native dependency versions first. For new apps, use latest stable. For compatibility, permissions, OTA, release, and platform behavior claims, verify official docs through `itsol-current-tech-context`.

## Reference Files

- `01-review-coverage-findings.md` - review workflow, coverage map, severity, findings format, and mobile Definition of Done.
- `02-architecture-dependencies.md` - app architecture, Expo Router, CNG/prebuild, app config, generated code, SDK/dependency compatibility, and New Architecture risk.
- `03-api-storage-ui-platform.md` - API/cache/offline behavior, storage, UI states, lifecycle, navigation, performance, accessibility, and platform matrix.
- `04-security-release-tests.md` - security, permissions, OTA/release safety, tests, QA scenarios, CI gates, and review risk flags.
