# Capabilities, Storage, And Security Review

## Capabilities Review

- In Tauri v2, capabilities grant permissions to windows or webviews. Review capability files and `tauri.conf.*` together.
- Prefer separate capability files per window, feature, or permission category.
- Avoid `windows: ["*"]` unless every window truly needs the permission.
- Remember that windows or webviews included in multiple capabilities effectively receive the union of permissions.
- Every new permission needs a feature reason, target window/webview, minimal scope, and a negative test or QA step.
- Do not accept broad permissions "for later."

## Filesystem, Shell, And Sidecars

- File operations must canonicalize and validate paths in Rust.
- User-selected paths still require type, size, content, permission, symlink, and race-condition handling.
- Filesystem scopes should be narrow; avoid granting the whole home directory without a business reason.
- Shell and process execution need allowlisted programs and arguments, timeouts, exit-code handling, and secret-free logs.
- Sidecars should be signed or verified, packaged per platform, tested after `tauri build`, and stopped on shutdown unless product behavior says otherwise.

## Storage And Secrets

- Store config, cache, domain data, logs, temp files, and secrets separately.
- Do not store access tokens, refresh tokens, API keys, private keys, passwords, or database encryption keys in `localStorage`, IndexedDB, normal frontend stores, plain config, or ordinary Tauri Store.
- Prefer OS keychain or a well-designed secure storage adapter for long-lived secrets.
- Do not put secrets in bundled frontend assets, Tauri config, release artifacts, logs, events, crash reports, or diagnostics.
- Local database encryption needs a key lifecycle; storing the key beside the database is not protection.

## CSP, Auth, And Logs

- Production CSP should be restrictive and checked in packaged builds.
- Avoid remote scripts and CDN assets in privileged desktop windows.
- If remote content is required, isolate it in a separate window/webview with minimal permissions.
- OAuth deep links and local callback servers must validate `state`; PKCE should be the default for public clients.
- Logs should include app version, OS, channel, and operation IDs, but redact tokens, personal data, payload bodies, and paths when required.
