# Project Architecture

## Version And Tooling Baseline

- Read `package.json`, lockfile, `app.json` or `app.config.*`, `eas.json`, TypeScript config, lint config, test config, CI, and any native directories before choosing an approach.
- Record Expo SDK, React Native, React, Expo Router, EAS CLI, Node, package manager, test tools, and whether `android/` and `ios/` are generated, committed, or manually owned.
- Prefer repo-pinned versions. For new projects or upgrades, check current official docs and package guidance before choosing SDK, Node, EAS CLI, or React Native versions.
- Do not advise installing npm latest React Native into an Expo app unless official Expo compatibility for the pinned SDK supports it.

## When Expo Fits

- Expo fits shared Android/iOS React Native apps that need common device APIs, development builds, EAS Build/Submit/Update, config plugins, preview distribution, or limited custom Swift/Kotlin modules.
- Expo does not remove Android/iOS knowledge. Permissions, signing, push, deep links, lifecycle, background work, storage, memory, and store review still need platform-aware design.
- Consider bare React Native or native apps when most product behavior is native, the app needs heavy C++ or unusual native integration, or the team explicitly owns Xcode/Gradle projects as source of truth.
- Do not leave Expo only because the feature needs custom native code; Expo Modules API and development builds are designed for that case.

## Architecture Sizing

- Small/MVP: group by feature with screens, components, hooks, validation, API adapters, and storage close together. Avoid service/repository layers for every simple request.
- Medium app: separate UI, feature domain logic, server-state queries/mutations, storage repositories, generated API adapters, monitoring, and navigation helpers.
- Large app or monorepo: share API clients, validation, domain logic, design tokens, and native modules only when there is real multi-app reuse. Do not force shared web/mobile UI when interaction models differ.
- Keep screen components from owning API clients, token refresh, storage migrations, permission flows, native modules, and analytics details.

## Suggested Boundaries

- `app/`: Expo Router routes and layouts.
- `features/<feature>/`: screens, components, queries, mutations, validation, feature domain logic, storage adapters, and tests.
- `shared/api/`: generated client, handwritten client adapter, auth/error mapping, request metadata, and fixtures.
- `shared/storage/`: repository interfaces, migrations, secure storage wrappers, SQLite adapters, and filesystem helpers.
- `shared/navigation/`: route parsing, deep link validation, auth redirects, and navigation helpers.
- `shared/monitoring/`: crash, analytics, logging, and release metadata.
- `modules/`: local Expo modules when a native boundary is required.

## Expo Router

- Use file-based routing as navigation structure, not a replacement for navigation design.
- Keep root layouts light. Avoid heavy data fetching, migrations, SDK initialization, and auth refresh storms in root layout.
- For Expo SDK 56+, do not import navigation APIs from external `@react-navigation/*` packages in application code. Use the matching `expo-router` entry points and run or review the official migration codemod during SDK 55 to 56 upgrades.
- Validate route params. Do not generate route names from untrusted input or store large objects in route params.
- Auth guards protect UX, not backend authorization. Backend authorization still decides access.
- Test Android back behavior, modals, tabs, nested stacks, process restoration, logout history cleanup, deep links, cold start, warm start, and background resume.

## TypeScript, Linting, And Dependencies

- New projects should use strict TypeScript unless the repo has a migration constraint. Consider `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` for new code after evaluating churn.
- Keep one package manager and one lockfile.
- Run Expo-aware linting and keep generated clients/native output excluded from lint only when appropriate.
- Do not disable `react-hooks/exhaustive-deps` globally.
- Before adding a dependency, check Expo SDK compatibility, New Architecture support, maintenance, license, permissions, config plugin needs, native code, binary size, startup impact, and whether an existing dependency already solves the problem.
- Treat native dependency additions as requiring a new development build and likely preview build verification.
