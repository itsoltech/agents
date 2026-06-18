---
name: expo-react-native-debugging
description: "Expo React Native debugging: Metro, dev builds, native builds, EAS, OTA/runtime, API, storage, platform, observability."
---

# Expo React Native Debugging

Debug Expo / React Native by locating the failing boundary first: JavaScript, Metro, Expo Router, native Android/iOS, CNG/prebuild/config plugin, development build, EAS Build, OTA/runtime/channel, API/network, storage/migration, device lifecycle, or observability.

## Process

1. State expected behavior, actual behavior, impact, platform, OS, device/simulator, app variant, app version, build number/versionCode, runtime version, update ID/channel, Expo SDK, React Native, and whether the failure is dev, preview, production, EAS-only, or OTA-only.
2. Inspect repo-pinned Expo SDK, React Native, Expo Router, EAS CLI, Node, package manager, native dependencies, app config, EAS profiles, test tools, and CI before recommending version-specific fixes.
3. For new-project, upgrade, EAS, OTA, or native compatibility advice, check current official Expo, React Native, EAS, and package docs through `itsol-current-tech-context`.
4. Gather evidence before changing code: Metro output, React Native DevTools, Expo dev menu, `expo-doctor`, resolved app config, native logs, EAS build logs, OTA deployment data, crash report metadata, API request IDs, and storage migration state.
5. Read [references/guide.md](references/guide.md), then load the focused reference for the suspected boundary.
6. Reproduce in the mode that fails. If a release build, EAS build, or OTA update fails, do not rely only on Expo Go or the Metro development server.
7. Fix one boundary at a time. Add a regression test when the repo supports it; otherwise document the narrowest reliable manual verification on Android and iOS when platform behavior is relevant.
8. Use `itsol-bug-debugging` for user-facing defects and follow its Technical Fix Plan gate when repo policy requires it.

## Coordination

Use with `itsol-current-tech-context`, `itsol-bug-debugging`, `itsol-tdd-workflow`, `ui-performance-stability`, `ui-frontend-testing-qa`, `hey-api-openapi-contract-debugging`, `security-auth-session-review`, `infra-observability`, and release/security Expo skills when OTA, EAS, permissions, privacy, credentials, or store behavior are part of the failure. For TanStack Query in mobile apps, use `tanstack-query-react-nextjs-debugging` only for framework-agnostic query keys, cache, mutation, invalidation, and auth-cache behavior; ignore Next.js SSR/App Router guidance unless web/Next.js is also in scope.
