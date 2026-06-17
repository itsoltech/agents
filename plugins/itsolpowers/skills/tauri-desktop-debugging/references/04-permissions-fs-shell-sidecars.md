# Permissions, Filesystem, Shell, And Sidecars

## Capabilities And Permissions

For Tauri v2 denied-access symptoms, inspect `src-tauri/capabilities/*.json` and any generated/declared permission scopes.

Check:

- capability applies to the relevant window/webview
- permission is present for the plugin/command being used
- scope is narrow but includes the selected path/action
- dev and prod capability files do not differ unexpectedly
- multiple capabilities do not accidentally combine broad privileges
- denied scenario is handled in UI instead of crashing

Do not "fix" by broadening to all windows or home-directory access without evidence and business justification.

## Filesystem

Debug file failures with:

- selected path, canonical path, symlink behavior
- OS permissions and sandbox/quarantine status
- Unicode, spaces, long Windows paths, case sensitivity
- file moved/deleted/locked after selection
- low disk space and partial writes
- packaged app writable path vs current working directory

Use temp-file plus flush plus rename for important writes. Avoid assuming the app can write beside the binary.

## Shell And Processes

Check:

- frontend is not passing arbitrary command strings
- Rust allowlist matches intended binary and arguments
- working directory and environment variables are correct
- timeout and kill policy work
- stdout/stderr are drained so the process cannot block
- exit code is mapped to a useful typed error
- secrets are not logged in command args

## Sidecars

Packaged-only sidecar failures usually come from path, target triple, permissions, signing, antivirus/quarantine, or update mismatch.

Verify:

- sidecar artifact exists in the bundle for the current OS/arch
- expected executable bit and signing/quarantine state
- relative paths and working directory after install
- stdout/stderr/exit code in logs
- behavior when process hangs, crashes, or produces excessive output
- shutdown kills or detaches intentionally
- sidecar version updates with the app or has explicit compatibility rules
