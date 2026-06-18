# Production Destructive Actions

## Production Default

Production and production-like environments are read-only by default. A task being "just dogfood" or "just smoke" does not grant permission to mutate real data.

Treat these as production-like unless the user says otherwise:

- live customer, tenant, billing, payment, email, SMS, push, admin, analytics, or integration systems
- staging connected to production services or real third-party accounts
- preview deployments using production databases, production SSO, production queues, or real webhook targets
- any environment where actions notify real users, alter money, change permissions, or persist data outside throwaway test accounts

## Explicit Consent

Ask for explicit consent before destructive or externally visible actions. Consent should name the environment, account, action type, allowed records, limits, and cleanup plan.

Operations needing explicit consent include:

- create, edit, delete, import, export, archive, restore, approve, reject, publish, send, invite, revoke, merge, transfer, or bulk actions
- billing, payments, refunds, subscriptions, invoices, credits, tax settings, plans, coupons, or financial exports
- email, SMS, push, webhook, notification, calendar invite, or external integration triggers
- admin actions, role changes, tenant changes, SSO settings, API keys, audit log exports, feature flags, or security settings
- file upload, file deletion, file sharing, download of private files, or document generation
- any action that persists data or changes visibility for another user

If consent is unclear, stop before the action and report the needed decision.

## Safe Execution Pattern

For approved mutations:

1. Use a dedicated test account or tenant.
2. Use clearly marked test data.
3. Confirm the exact record before acting.
4. Prefer the smallest possible mutation.
5. Capture evidence before and after the action without exposing sensitive data.
6. Verify expected side effects and unexpected side effects.
7. Run the cleanup plan immediately when appropriate.
8. Report cleanup status, remaining records, and any manual follow-up.

Never use hidden DOM edits, storage edits, request replay, or direct API calls to bypass normal UI confirmation for a production action unless the user explicitly scoped that diagnostic method and the environment is safe for it.

## Test Accounts And Feature Flags

Prefer test accounts with:

- least privilege for the scenario
- isolated tenant or sandbox data
- no real payment method
- no real customer communications
- no broad admin access unless admin behavior is the explicit target
- reversible data and a known cleanup path

Feature flags can change production behavior. Record enabled flags when known, but do not toggle production flags unless the user explicitly authorizes the exact flag, value, scope, rollback, and owner.

## Mocking And Resilience Limits

Mocking, request interception, simulated failures, offline mode, clock changes, seeded latency, and forced error responses are useful for resilience checks, but only outside production and only with user consent.

When results depend on mocks or simulation:

- label the finding as simulated
- state what was mocked
- state what was not proven against live services
- avoid claiming production behavior unless separately verified
- keep mock configuration and artifact paths separate from live evidence

If a resilience scenario requires production validation, use observation-only checks first and ask for a scoped plan before any action that could disrupt users or data.
