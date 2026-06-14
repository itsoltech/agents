---
name: ui-view-states-forms
description: "UI states/forms: hierarchy, loading, empty, errors, permissions, tables, cache, optimistic UI."
---

# UI View States And Forms

Design the view around user decisions, data states, permissions and feedback, not only around the happy-path mockup.

## Process

1. Identify the primary user goal, most important information, main action, destructive actions, and what should be visible first.
2. Model all relevant states before coding: first load, background refetch, empty, partial, permission denied, validation error, server error, network error, rate limit, offline, readonly, disabled, stale data and deleted entity.
3. Keep loading states proportional; use cached data plus small refresh indicators when possible, and match skeleton dimensions to final layout.
4. Make empty states explain why there is no data and provide a next action when the user can act.
5. Make errors actionable and distinguish validation, system, auth, conflict, rate-limit and network failures.
6. For forms, provide labels, field-level errors, keyboard support, double-submit protection, focus after submit errors, and no data loss after API errors.
7. For tables and lists, show only decision-relevant fields, provide mobile-friendly alternatives, and avoid hiding task-critical data in truncation.
8. For optimistic UI, implement rollback and avoid it for destructive, financial, backend-rule-heavy or conflict-prone operations.

Read [references/guide.md](references/guide.md) for state and interaction checklists.
