---
name: expo-react-native-implementation
description: "Expo React Native implementation: architecture, Expo Router, dev builds, CNG, app config, native modules, state, storage, tests."
---

# Expo React Native Implementation

Implement Expo / React Native mobile apps as production mobile software, not generic React screens. Treat the Expo SDK, native runtime, app config, development builds, OTA compatibility, and platform behavior as part of the feature contract.

## Process

1. Inspect repo-pinned Expo SDK, React Native, React, Expo Router, EAS CLI, Node, package manager, lockfile, app config, EAS profiles, test tools, and CI before choosing commands or versions.
2. For new projects or version-sensitive decisions, check current official Expo, React Native, EAS, and package docs through `itsol-current-tech-context`; do not assume npm latest React Native is compatible with the pinned Expo SDK.
3. Read [references/guide.md](references/guide.md), then load only the focused reference files needed for the feature.
4. Define the native contract early: app variant, bundle ID/package name, scheme, permissions, config plugins, development build needs, runtime version impact, and whether the change can ship by OTA or needs a new binary.
5. Keep screen components thin. Route API, server state, durable storage, permissions, navigation orchestration, native module calls, analytics, and offline sync through feature or shared adapters.
6. Use development builds for production-grade work. Expo Go is only enough for prototypes or features with no app-specific native runtime needs.
7. Add focused verification: lint, typecheck, tests, `expo-doctor`, dependency checks, prebuild/config checks when native config changes, and Android/iOS smoke tests for platform-sensitive behavior.

## Coordination

Use with `itsol-current-tech-context`, `itsol-tdd-workflow`, `ui-ux-workflow`, `ui-accessibility-motion`, `ui-performance-stability`, `hey-api-openapi-codegen`, `security-auth-session-review`, `security-files-integrations-review`, and release/security Expo skills when OTA, EAS, permissions, privacy, credentials, or store behavior are in scope. For TanStack Query in mobile apps, use `tanstack-query-react-nextjs-implementation` only for framework-agnostic query keys, cache, mutation, invalidation, and auth-cache patterns; ignore Next.js SSR/App Router guidance unless web/Next.js is also in scope.
