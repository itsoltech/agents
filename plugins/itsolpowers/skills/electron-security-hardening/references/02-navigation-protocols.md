# Navigation, External Links, And Protocols

## Navigation Controls

- Block unexpected `will-navigate`.
- Use `setWindowOpenHandler` to deny by default.
- Open external links through `shell.openExternal` only after URL validation.
- Permit `https:` external URLs only unless a reviewed product need exists.
- Block `file:`, `javascript:`, `data:`, `vbscript:`, and unknown custom protocols by default.
- Validate with `new URL()`, not string prefixes.
- Allowlist `protocol`, `hostname`, and when needed `port`.

## External Link Pitfalls

- `https://trusted.example.com.attacker.test` is not the trusted host.
- Encoded URLs, redirects, deep links, and support links are user-controlled input.
- Do not pass untrusted strings directly to `shell.openExternal`.
- Consider whether a link should open in the OS browser instead of a privileged app window.

## Custom Protocols

- Register schemes before `app.ready`.
- Grant only required privileges such as `standard`, `secure`, or fetch support.
- Avoid `bypassCSP`.
- Map URL paths through an allowlist.
- Canonicalize paths before filesystem access.
- Reject `..`, symlink escape, absolute path injection, and ambiguous encodings.
- Treat deep links as untrusted input that may carry hostile payloads.

## Review Questions

- Can renderer navigate the app to attacker-controlled content?
- Can an attacker trigger a local file read through protocol path mapping?
- Can a deep link reach an IPC handler, file action, or auth flow without validation?
- Are OAuth or support flows isolated from desktop APIs?
- Are protocol handlers and file associations tested with malformed input?
