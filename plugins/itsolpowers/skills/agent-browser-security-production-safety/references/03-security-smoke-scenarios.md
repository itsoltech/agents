# Security Smoke Scenarios

## Scope Boundary

Security smoke checks are lightweight, scoped observations. They are not penetration tests, scanner runs, exploit attempts, fuzzing campaigns, or authorization to attack the target.

Do not perform invasive testing without explicit scope:

- brute force, credential stuffing, password spraying, token guessing, or session fixation attempts
- high-volume crawling, fuzzing, injection payload sweeps, or automated vulnerability scanners
- exploit chaining, privilege escalation attempts, destructive payloads, or bypass of UI confirmations
- testing outside approved URLs, tenants, accounts, roles, files, or integrations

When in doubt, stop at observation and ask for scope.

## Auth And Session Smoke

Safe checks:

- login succeeds for the approved test account and lands on the expected route
- logout removes access to authenticated pages after refresh and direct navigation
- session expiry or 401 response produces a clear user-visible state
- refresh preserves expected session state without exposing previous-user data
- private routes are not visible before login
- account switch or tenant switch does not flash stale data from the prior context

Evidence should show route shape, role, visible state, and redacted artifact paths. Do not include cookies, token values, auth headers, or raw auth-state files.

## Permissions And Tenant Isolation

Use only approved accounts, tenants, and records. Do not enumerate unknown IDs or scrape tenant data.

Safe checks:

- lower-privilege users do not see forbidden navigation or actions
- direct navigation to a known forbidden route gives an expected denial state
- user cannot open a known out-of-scope tenant record provided by the test setup
- admin-only controls are hidden or disabled for non-admin roles
- second-tab or tenant switch does not leak previous tenant cache
- API denial is reflected by a safe UI state rather than private data

Report whether the denial was UI-only, API-backed, or not verified. Mask record and tenant IDs unless exact values are required for the project.

## Sensitive Data Exposure

Check visible UI, copied text, console output, network summaries, downloads, and browser artifacts for unnecessary sensitive data.

Safe checks:

- pages do not render secrets, raw tokens, reset links, invite links, or private debug payloads
- console logs do not print credentials, auth headers, full customer records, or private request bodies
- network summaries used for evidence do not expose private payloads
- account menus, notifications, and screenshots do not reveal unrelated users or tenants
- exported or downloaded files are available only when the action is in scope and authorized

When sensitive data appears, preserve only redacted evidence and record the exact location type, not the raw value.

## Browser Security Signals

Within normal browsing and diagnostics, observe:

- CSP, mixed-content, framing, and insecure-resource console messages
- security headers visible through approved diagnostics
- CORS or CSRF-related errors that affect the tested flow
- whether state-changing forms have expected confirmation and error handling
- file uploads reject unsupported file types or oversize files when those checks are in scope
- file downloads have expected access control and safe names

Do not escalate from a signal to an exploit. For example, a CORS error can be reported as a flow defect or security observation, but do not attempt cross-origin abuse unless explicitly scoped.

## Reporting

For each smoke check, report:

- scenario and role
- expected result
- observed result
- whether it was read-only, approved mutation, or simulated
- redacted evidence path or safe summary
- blocked scope and reason
- residual risk or follow-up security review needed
