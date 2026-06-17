# Capabilities And Permissions

## Tauri v2 Model

- Capabilities grant permissions to specific windows or webviews.
- Permissions can enable or deny commands, define scopes, or combine both.
- A window/webview included in multiple capabilities effectively gets the union of those permissions.
- Capability files belong under `src-tauri/capabilities` or equivalent project layout and must be reviewed with `tauri.conf.*`.
- Treat capability and permission changes as security-sensitive code, not config noise.

## Least Privilege Rules

- Create separate capability files per window, feature, or permission category.
- Avoid `windows: ["*"]` unless the permission is truly global.
- Do not combine unrelated powers into one capability just to reduce files.
- Require a business reason for each permission and scope.
- Use narrow allow scopes and deny scopes for exceptions when supported by the permission.
- Keep dev-only permissions out of production capabilities.

## Review Template

```md
Capability:
Window/webview:
Permissions:
Scopes:
Feature reason:
Can the scope be narrower:
Dev or production:
Negative test or QA:
Residual risk:
Decision:
```

## Red Flags

- New filesystem, shell, process, clipboard, global shortcut, updater, or deep-link permission without user-facing need.
- Capability grants access to a settings, login, update, logs, or remote-content window that does not need it.
- Plugin permission added without reviewing plugin platform support and command scopes.
- Permission exists only because Rust command validation is missing.
- Tests only prove the allowed path and never prove denied access.
