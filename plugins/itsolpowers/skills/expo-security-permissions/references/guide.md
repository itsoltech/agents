# Expo Security Permissions Reference Index

Use this index to choose focused mobile security guidance. Do not load every file unless the task covers the full Expo app security posture.

## How To Use

1. Map the trust boundary: secrets, app config, auth/session, local storage, permissions/privacy, deep links, WebView, network, OTA integrity, dependencies, or credentials.
2. Open the corresponding reference files.
3. For repo work, detect pinned Expo SDK, React Native, EAS CLI, `expo-updates`, `expo-secure-store`, and native dependency versions first. For new apps, use latest stable. For permission semantics, secure storage, deep links, WebView, update signing, and release security claims, verify official docs through `itsol-current-tech-context`.

## Reference Files

- `01-threat-model-secrets-auth.md` - mobile threat model, bundled data, secrets, OAuth/PKCE, token storage, session cleanup, and backend authorization.
- `02-permissions-privacy-storage.md` - permission prompts, Info.plist/AndroidManifest, blocked permissions, privacy declarations, SecureStore, SQLite, files, and cleanup.
- `03-deep-links-webview-network.md` - deep links, universal/app links, notification payloads, WebView, browser/OAuth flows, and network security.
- `04-update-integrity-supply-chain.md` - EAS Update integrity, code signing, credentials, dependency permissions, native packages, CI gates, and supply-chain review.
