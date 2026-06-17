# Windows, Sessions, And Security

## BrowserWindow Baseline

Production windows should explicitly set hardened defaults:

```ts
new BrowserWindow({
  show: false,
  webPreferences: {
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    devTools: !app.isPackaged,
  },
});
```

Do not load untrusted remote code in a window that has access to desktop APIs.

## Navigation And External Links

- Block unexpected `will-navigate`.
- Deny `window.open` by default.
- Open external URLs with `shell.openExternal` only after validating with `URL`.
- Allow only expected `https:` hosts for external links.
- Reject `file:`, `javascript:`, `data:`, `vbscript:`, and unrecognized custom protocols unless explicitly supported.
- Avoid `startsWith` URL checks; validate protocol, hostname, and port.

## Sessions And Permissions

- Use separate sessions for trusted app UI, external content, and tests when their trust or cookies differ.
- Add request and check handlers for permissions such as camera, microphone, notifications, HID, serial, USB, MIDI, geolocation, and screen capture.
- Do not grant a permission just because renderer asked for it; model renderer compromise as possible.
- Clear cookies, cache, query state, secrets, storage, and subscriptions on logout or user/tenant switch according to the app's data model.

## CSP And Protocols

- Production CSP should start from `default-src 'self'`.
- Avoid `unsafe-eval` and remote scripts in production.
- Avoid `unsafe-inline` unless the framework/build requires it and the tradeoff is explicit.
- Prefer a custom app protocol when `file://` creates origin or CSP problems.
- Register protocol schemes before `app.ready`.
- Do not set `bypassCSP` without a specific reviewed reason.
- Canonicalize and allowlist file paths served by custom protocols.

## Threat Model Checks

For each new IPC, file, network, protocol, or OS feature ask:

- What can a compromised renderer send?
- Can the operation touch files, network, secrets, updater, shell, or OS permissions?
- Is the payload validated and authorized against the sender window?
- Can an event leak to the wrong window, tenant, user, or project?
- What happens after logout, update, crash, or storage migration failure?
