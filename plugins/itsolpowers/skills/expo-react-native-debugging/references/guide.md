# Expo React Native Debugging Reference Index

Use this routing index after reading `SKILL.md`. Load only the files matching the failure mode.

## Reference Routing

- Evidence matrix, repro isolation, version detection, mode/platform classification, and cache-reset discipline: read [01-evidence-and-triage.md](01-evidence-and-triage.md).
- Metro, JavaScript, Expo Router, development builds, Expo Go limits, CNG/prebuild, config plugins, native build logs, Android, iOS, and New Architecture failures: read [02-metro-dev-build-native-build.md](02-metro-dev-build-native-build.md).
- EAS Build, EAS-only failures, EAS environments, EAS Update, OTA runtime/channel/branch, asset loading, rollback, and update metadata: read [03-eas-build-update-runtime.md](03-eas-build-update-runtime.md).
- API/network/auth, TanStack Query, generated clients, offline sync, local storage, SecureStore, SQLite, filesystem, platform-specific behavior, lifecycle, permissions, deep links, and push: read [04-api-storage-platform.md](04-api-storage-platform.md).
- Crash reporting, logs, release metadata, monitoring, source maps, maintenance signals, performance regressions, and final debugging reports: read [05-observability-maintenance.md](05-observability-maintenance.md).

## Version Policy

- Existing repo: debug against pinned Expo SDK, React Native, React, Expo Router, EAS CLI, Node, package manager, native dependencies, app config, EAS profiles, and CI/release configuration.
- New-project or upgrade-sensitive advice: use latest stable choices only after checking official Expo, React Native, and EAS docs through `itsol-current-tech-context`.
- Symptoms involving SDK upgrades, development builds, CNG/prebuild, config plugins, New Architecture, Expo Router, EAS Build, EAS Update, or native module APIs require current official docs before recommending version-specific fixes.
