# Review Coverage And Findings

## Coverage Map

- Behavior: requirement works on Android and iOS, or platform differences are deliberate and documented.
- View states: loading, empty, error, offline, retry, denied permission, and disabled-action states are handled.
- Lifecycle: route focus, app foreground/background, process restore, subscriptions, listeners, retries, and background work do not duplicate or leak.
- Architecture: UI, application logic, API client, server state, local persistence, secrets, and native boundary have clear ownership.
- Dependencies: Expo SDK compatibility, native code, config plugins, permissions, New Architecture support, maintenance, and replacement options are reviewed.
- Release impact: decide whether the change is safe for OTA, requires a preview/store binary, changes runtime version, or needs rollback planning.
- Test evidence: unit, integration, E2E, device QA, upgrade, permission denial, and platform checks match the risk.

## Severity Guidance

- **Critical:** ships a secret, bypasses auth, corrupts durable data, publishes runtime-incompatible OTA, or blocks app launch for a broad cohort.
- **High:** native change lacks binary-release path, permission/privacy declaration is wrong, logout leaves sensitive data, deep link executes unsafe action, or release cannot be rolled back.
- **Medium:** missing platform QA for platform-specific code, untested storage migration, dependency compatibility not verified, offline/error behavior broken, or EAS config can publish to the wrong channel.
- **Low:** maintainability, naming, minor copy, narrow test gaps, or documentation issues with limited user impact.

## Finding Format

Lead with findings, ordered by severity:

```md
Severity: High
File/line:
Issue:
Impact:
Evidence:
Recommendation:
Verification gap:
```

## Mobile Definition Of Done

- Android and iOS behavior is covered, or differences are explicit.
- Accessibility, large text, dark mode, slow network, offline, app resume, and denied permissions were considered for user-facing changes.
- `expo-doctor`, lint, typecheck, and relevant tests have no new blocking failures.
- Native dependency, permission, app config, SDK, or config plugin changes have a new development/preview/store binary plan.
- OTA changes identify runtime, channel, update ID tracking, staging validation, rollout, and rollback.
- Local storage migrations and cleanup are tested for fresh install, upgrade, logout, and rollback-sensitive flows.
