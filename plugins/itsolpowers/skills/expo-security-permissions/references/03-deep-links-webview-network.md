# Deep Links, WebView, And Network Security

## Deep Links And Universal/App Links

- Treat every link, route param, and notification payload as untrusted input.
- Validate route name, params, expected origin, state, tenant/account context, and authorization before performing work.
- Do not execute destructive or high-risk actions immediately on link open.
- Preserve only verified internal redirects after login.
- Prefer universal links/app links for sensitive flows when possible.
- Test cold start, warm start, background resume, logged-out state, expired session, malformed params, and wrong account.

## Browser And OAuth

- Use the system browser or platform-supported auth session flow for OAuth; avoid arbitrary embedded WebView OAuth.
- Use PKCE and validate `state`.
- Do not allow arbitrary redirect URLs from query params or remote config.
- Do not leak tokens through query strings, logs, analytics, referrers, or WebView messages.

## WebView

- Avoid WebView for flows that can be implemented natively or through the system browser.
- Restrict allowed origins and navigation.
- Avoid enabling broad JavaScript bridges for untrusted content.
- Validate all messages crossing between WebView and React Native.
- Do not inject tokens into third-party pages.
- Isolate remote content from privileged app actions and sensitive storage.

## Network Security

- Use HTTPS for production API traffic.
- Do not disable certificate validation in production.
- Avoid global cleartext traffic allowances.
- Certificate pinning needs rotation, recovery, incident, and support plans before adoption.
- Do not send secrets in query strings.
- Redact authorization headers and sensitive response bodies from logs and crash reports.
- TLS proves transport security, not user authorization.

## Red Flags

- Deep link changes state without confirmation or auth checks.
- Notification payload controls navigation or mutation without validation.
- WebView can navigate to arbitrary origins or send arbitrary commands to the app.
- OAuth happens inside an untrusted embedded WebView.
- Debug network settings leak into production.
