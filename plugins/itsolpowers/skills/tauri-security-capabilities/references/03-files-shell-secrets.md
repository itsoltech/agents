# Files, Shell, Sidecars, And Secrets

## Filesystem

- Use file dialogs when the user must select files, then still validate the result in Rust.
- Canonicalize paths and defend against `../`, symlinks, case differences, Unicode names, Windows long paths, missing files, locked files, and permission errors.
- Validate file type, size, and content. Do not trust extensions.
- Use atomic writes for important config or data files.
- Do not write beside the binary or rely on current working directory.
- Keep app config, cache, domain data, temp files, and logs in appropriate OS directories.

## Shell, Process, And Sidecar

- Never pass arbitrary shell commands or arguments from frontend to Rust.
- Use allowlisted programs and argument schemas.
- Set timeouts, environment, working directory, stdout/stderr handling, and exit-code mapping deliberately.
- Do not run sidecars as admin/root.
- Sign or verify sidecar artifacts when integrity matters.
- Test sidecar paths after packaging, not only in dev.
- Decide whether sidecars update with the app and how they shut down.

## Secrets

- Do not store access tokens, refresh tokens, API keys, private keys, passwords, connection strings, or database encryption keys in frontend storage, ordinary Tauri Store, plain config, logs, events, crash reports, or diagnostics.
- Prefer OS-native secure storage or a carefully designed secure storage adapter.
- Stronghold can be appropriate, but only with an explicit password/key lifecycle.
- Access tokens can often stay in memory while refresh tokens stay in secure storage.
- Logout should clear secrets, user cache, session data, and active background work.
- Offline mode must define which data remains on disk after logout.

## Diagnostics

- Logs should rotate and include app version, OS, architecture, channel, and operation IDs.
- Diagnostic bundles must redact secrets, tokens, payload bodies, personal data, and sensitive local paths.
- Crash reports need explicit redaction and user/privacy policy alignment.
