# Expo React Native Implementation Reference Index

Use this routing index after reading `SKILL.md`. Load only the files needed for the implementation decision.

## Reference Routing

- Version detection, project sizing, Expo fit, folder boundaries, Expo Router, TypeScript, linting, and dependency policy: read [01-project-architecture.md](01-project-architecture.md).
- Development builds, Expo Go limits, Continuous Native Generation, prebuild, app config, config plugins, variants, environment variables, SDK upgrades, New Architecture, and React Compiler: read [02-development-builds-cng-config.md](02-development-builds-cng-config.md).
- Mobile state, generated API clients, TanStack Query, network behavior, offline sync, SecureStore, AsyncStorage, SQLite, and filesystem storage: read [03-state-api-offline-storage.md](03-state-api-offline-storage.md).
- Expo Modules API, native module API design, permissions/build-time configuration, lifecycle, background tasks, push notifications, deep links, and platform differences: read [04-native-modules-lifecycle-notifications.md](04-native-modules-lifecycle-notifications.md).
- Rendering, lists, assets, startup, bundle analysis, native boundary performance, accessibility, unit/integration/E2E/native tests, release matrix, and QA scenarios: read [05-performance-accessibility-tests.md](05-performance-accessibility-tests.md).

## Version Policy

- Existing repo: implement against pinned Expo SDK, React Native, React, Expo Router, EAS CLI, Node, package manager, native dependencies, app config, and EAS profiles.
- New project: use latest stable Expo choices only after checking official Expo, React Native, and EAS docs through `itsol-current-tech-context`.
- Install Expo and React Native version-sensitive packages with the repo's Expo-aware workflow, usually `npx expo install`, because Expo SDK compatibility controls the valid React Native package versions.
- Version-sensitive choices involving SDK upgrades, development builds, CNG/prebuild, config plugins, New Architecture, Expo Router, EAS, and OTA runtime compatibility require current official docs before finalizing.
