# Updater, Platform Behavior, Tests, And QA

## Updater Review

- Treat auto-update as a release process, not only plugin usage.
- Tauri updater artifacts require signature verification; review public-key config, private-key lifecycle, artifact signing, and metadata publishing.
- Check update channels such as internal, beta, and stable, plus staged rollout and rollback needs.
- Test no-update, malformed metadata, signature mismatch, missing artifact, interrupted download, low disk, app close during update, old-version upgrade, and local-data migration.
- Update UX should not interrupt work without a clear product decision.

## Platform Review

- WebView behavior differs across Windows WebView2, macOS WebKit, and Linux WebKitGTK.
- Review Windows long paths, Unicode paths, locked files, antivirus, standard-user installs, and SmartScreen behavior.
- Review macOS signing, notarization, Gatekeeper, Apple Silicon, Intel, sandbox-related assumptions, and multi-monitor window restoration.
- Review Linux target distributions, package format expectations, WebKitGTK dependencies, AppImage/RPM/Deb differences, and desktop integration.
- Do not rely on `tauri dev` for behavior that depends on bundled assets, sidecars, permissions, CSP, updater, or signing.

## Test Coverage

- Frontend: UI components, forms, command adapter mocks, error mapping, query/store logic, and listener cleanup.
- Rust: DTO validation, services, path validation, local persistence, migrations, filesystem errors, and command helper functions without full WebView.
- Integration: command handler plus service plus persistence, secure storage adapter with mock/test backend, mock API, updater state machine, and sidecar lifecycle.
- E2E/manual: full app launch, onboarding, login/logout, import/export, offline mode, permission denial, restart, tray/menu/deep link, and update flow when relevant.

## Review Risk Flags

- No packaged-build smoke test for a desktop-affecting change.
- Capability or permission change without rationale and negative test.
- Storage migration without upgrade test.
- File/shell/deep-link behavior without bad-input cases.
- Updater or signing change without artifact verification.
- Platform-specific code without target-platform QA evidence.
