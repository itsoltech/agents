# Coverage And Findings Taxonomy

## Coverage Matrix

Build coverage before final verdicts. Include only dimensions relevant to the tested product, but make omissions explicit.

Recommended rows or columns:

- user flows: happy path, negative path, validation, recovery, empty states, permission denial, destructive actions
- viewports: mobile, tablet, desktop, narrow/wide layout, orientation when relevant
- roles and permissions: anonymous, authenticated, owner, admin, limited role, cross-tenant or cross-account boundaries
- browsers and devices: supported browser families, real device or emulation status, keyboard/touch expectations
- cache, offline, and live events: refresh, back/forward, stale data, optimistic updates, retry, reconnect, websocket/SSE/polling updates
- accessibility: keyboard path, focus order, labels, landmarks, contrast risk, reduced motion, screen-reader-visible state
- API and network: status codes, request timing, retries, failed dependencies, request/response correlation, idempotency risk
- regression areas: adjacent flows, shared components, auth/session, forms, lists/tables, routing, navigation, data persistence, notifications

Use these statuses:

- `covered`: tested with usable evidence
- `partial`: exercised but missing role, viewport, data state, or artifact
- `blocked`: could not test because setup, environment, data, credentials, or tooling prevented execution
- `untested`: in scope but not attempted
- `not-applicable`: explicitly outside the product behavior or release scope

## Finding Types

- `bug`: product behavior contradicts expected behavior, acceptance criteria, or stable user expectation
- `ux`: confusing, inefficient, inconsistent, or misleading experience without clear functional failure
- `a11y`: accessibility barrier or likely WCAG/usability issue
- `performance`: slow, unstable, resource-heavy, layout-shifting, or delayed interaction behavior
- `security`: auth, authorization, data exposure, input handling, session, or unsafe workflow concern
- `test-gap`: missing automated/manual coverage, unclear acceptance criteria, or missing regression check
- `environment/tooling`: issue caused by test environment, configuration, data, browser automation, or local setup
- `blocked`: validation could not continue and the blocked scope matters
- `observation`: useful factual note that is not actionable as a defect

## Severity, Priority, Confidence

Severity describes impact:

- `S1`: release blocker, data loss, security exposure, unavailable core path, or no viable workaround
- `S2`: major path broken or high user impact with limited workaround
- `S3`: meaningful defect in a secondary path, limited role, recoverable state, or clear workaround
- `S4`: low impact, polish, copy, alignment, minor inconsistency, or low-risk observation

Priority describes scheduling urgency and may differ from severity. Explain when priority is higher or lower than severity because of release timing, visibility, customer impact, feature flags, or workaround quality.

Confidence describes evidence quality:

- `high`: reproduced consistently with clear artifacts and stable expected behavior
- `medium`: reproduced or strongly evidenced, but environment, data, or timing leaves some uncertainty
- `low`: plausible issue needing another pass, better data, or stakeholder confirmation

## Minimal Finding

Every actionable finding needs:

- title
- type, severity, priority, and confidence
- environment: URL or environment name, deployment/build, browser/device, viewport, role, data state
- steps to reproduce
- expected result
- actual result
- evidence: screenshot, video, console, network, trace, HAR, log, or artifact path
- scope and impact
- suspected owner, stated as a hypothesis when not proven
- repro confidence or frequency
- suggested next verification

Do not include raw secrets, cookies, tokens, auth state, personal data, or sensitive payloads in steps or evidence.
