# UI View States And Forms Guide

## Information Hierarchy

- The most important information should be visible without searching.
- The primary action should be easy to find.
- Destructive actions should be visually distinct from primary actions.
- Secondary information should not compete with the main task.
- Related controls should be grouped as one decision.
- Do not put important information only in a tooltip.
- Do not hide validation errors outside the visible form area.

## View States

Plan:

- first load;
- background refetch;
- optimistic update;
- empty data;
- partial data;
- permission denied;
- validation error;
- server error;
- network error;
- rate limit;
- offline/degraded connectivity;
- readonly;
- disabled due to business rules;
- stale data;
- deleted entity.

## Forms

- Every field has a label; placeholder is not a label.
- Errors are close to and associated with the field.
- Error copy tells the user what to fix.
- Frontend validation does not replace backend validation.
- Required and optional fields are distinguishable.
- Submit is safe against double click.
- After submit error, focus moves to the first invalid field or an error summary.
- Destructive actions require confirmation or undo when hard to reverse.
- Long forms are split into meaningful decision sections.
- Do not reset user input after an API error.

## Tables And Lists

- Desktop table does not have to remain a table on mobile.
- Columns should match user decisions, not all available data.
- Sorting, filtering and pagination follow existing app patterns.
- Row click and row actions must not conflict.
- Long text needs controlled wrapping or truncation.
- Truncation must not hide task-critical information.
- Large lists need pagination, cursoring, infinite scroll with keyboard fallback, or virtualization.

## API And Cache States

- Separate initial loading from background loading.
- Keep visible data during background refresh and show a smaller refresh signal.
- Cache keys must include tenant/user/locale where relevant.
- Realtime events should update cache through explicit mapping.
- UI should not require request waterfalls when API can provide the needed data.
- Cache must not hide missing permissions.

## Optimistic UI

Use optimistic UI when success is likely, rollback is simple, and the result can be predicted locally.

Avoid or add extra safeguards for financial, destructive, backend-rule-dependent, conflict-prone or hard-to-rollback operations.
