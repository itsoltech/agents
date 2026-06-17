# Files, Secrets, Storage, And Diagnostics

## File Access

- Renderer should not provide arbitrary paths for direct read/write.
- Use system dialogs for user-selected files.
- Store authorized paths in a controlled model.
- Canonicalize with real path checks before access.
- Check symlinks and enforce expected roots when a feature is scoped to a project/workspace.
- Validate extension and file content type when format matters.
- Do not execute or auto-open `.lnk`, `.url`, `.desktop`, `.command`, `.bat`, `.cmd`, `.ps1`, or `.sh` from untrusted sources.
- Write crash-safe files via temporary file plus rename when atomicity matters.

## Storage

- Version local schemas and make migrations idempotent.
- Test migrations from previous versions.
- Handle corrupted config and partially-written files.
- Separate cache per user, tenant, and project when data isolation matters.
- Do not put large business files in `userData` without a product reason.

## Secrets

- Store refresh tokens, private API keys, license secrets, and signing material outside renderer.
- Prefer OS-backed storage from main, such as `safeStorage`, keychain, credential manager, or approved secret service.
- Check encryption availability and define a secure fallback.
- Remove secrets from memory and disk on logout.
- Never store secrets in localStorage, IndexedDB, query cache, logs, crash reports, plain JSON, Redux devtools, or public sourcemaps.

## Diagnostics

- Structure logs with timestamp, process, version, channel, platform, and correlation ID.
- Redact tokens, cookies, passwords, PII payloads, full secret-bearing URLs, local sensitive paths, and storage content.
- Crash reports need redaction and user/product consent posture.
- Diagnostic bundles must redact before archive creation.
