# Threat Model, Secrets, And Auth

## Mobile Threat Model

- The app runs on a device the user controls.
- A motivated user can inspect the JavaScript bundle, assets, app config, local databases, logs, and network traffic on a controlled device.
- A user can tamper with local data, device time, deep-link inputs, notification payloads, and repeated requests.
- Rooted or jailbroken devices may bypass OS protections.
- Backend authorization and integrity checks must not depend on the mobile UI behaving honestly.

## Secrets

- Do not place secrets in source code, app config, `EXPO_PUBLIC_*`, assets, JavaScript bundle, source maps, logs, crash reports, analytics, or diagnostics.
- EAS secrets protect values during build jobs; they do not protect values embedded into a shipped app.
- Public SDK keys should be restricted by bundle ID, package name, domain, backend proxy, quota, or product controls where possible.
- Private operations belong behind a backend, not in the mobile client.
- Rotate compromised credentials and review release artifacts and logs for exposure.

## Auth And Session

- Use OAuth Authorization Code with PKCE for mobile public clients unless a stronger repo-specific design exists.
- Do not put OAuth client secrets in the app.
- Store refresh tokens in SecureStore or an equivalent native-backed secure adapter; avoid AsyncStorage, plain files, SQLite, Redux/Zustand, or query cache for secrets.
- Keep access tokens short-lived and preferably in memory.
- Serialize refresh flows so concurrent requests do not race and overwrite token state.
- Require re-authentication or step-up checks for high-risk actions.
- Hidden screens, disabled buttons, and route guards are not authorization.

## Logout And Account Switch

- Clear refresh tokens, access tokens, account-scoped query cache, local domain data that should not persist, offline queues, live connections, push subscriptions where appropriate, and background work.
- Define what remains on disk for offline support after logout, and document the user/security tradeoff.
- Test logout after failed refresh, offline logout, app kill during logout, and account switch.

## Review Red Flags

- A token or API key is visible in app config, bundle, source maps, logs, crash reports, or analytics.
- Backend endpoints trust only route visibility or client-provided ownership.
- Refresh token is stored outside native secure storage.
- Logout clears navigation but leaves cache, SQLite rows, files, or background subscriptions.
- Auth error handling creates infinite refresh loops or duplicate requests.
