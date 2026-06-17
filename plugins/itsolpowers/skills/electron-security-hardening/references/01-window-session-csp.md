# Window, Session, And CSP Hardening

## BrowserWindow Baseline

Set production windows explicitly:

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- `webSecurity: true`
- `allowRunningInsecureContent: false`
- `devTools: false` or guarded by an internal-build feature flag
- `preload` points to a local bundled file

Do not combine trusted app UI and untrusted remote content in the same privileged window.

## Session Policy

- Use separate sessions for trusted app UI, external content, tests, and support/debug surfaces when their trust differs.
- Do not share cookies between trusted UI and untrusted content.
- Set `setPermissionRequestHandler` and `setPermissionCheckHandler`.
- Default deny camera, microphone, notifications, MIDI, HID, serial, USB, geolocation, and screen capture unless product requirements justify them.
- Permission decisions check trusted origin and feature context, not only renderer request text.

## CSP Baseline

- Use `default-src 'self'`.
- Avoid `unsafe-eval` in production.
- Avoid `unsafe-inline` unless the framework/tooling requires it and the tradeoff is documented.
- Allowlist API, image, font, and connect sources.
- Do not load production scripts from CDN.
- Use different dev and production CSP.
- For `file://`, use a meta CSP or a custom protocol with CSP preserved.
- Do not set `bypassCSP` on custom protocols unless there is a specific reviewed need.

## Remote Content

- Do not load remote code in a window that has access to desktop APIs.
- External documentation, OAuth, support pages, or previews should use unprivileged windows, iframes, or the OS browser depending on risk.
- If remote content is unavoidable, give it a separate session, no privileged preload, strict navigation policy, and minimal permissions.
