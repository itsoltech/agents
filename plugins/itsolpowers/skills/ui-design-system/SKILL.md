---
name: ui-design-system
description: Use when designing, implementing, or reviewing frontend design-system decisions, UI consistency, design tokens, base components, semantic variants, component states, shared layout primitives, Storybook/component examples, or whether a new UI pattern belongs in the system.
---

# UI Design System

Keep UI consistent with the application. Do not design each view as a one-off screen.

## Process

1. Find existing tokens, base components, domain components, variants, examples, and visual patterns before creating anything new.
2. Use semantic token and variant names such as `primary`, `secondary`, `danger`, `muted`, `border`, or `success`; avoid names tied to one page or color accident.
3. Prefer extending an existing component API when it preserves consistency and does not create confusing variants.
4. Create a new base component only when the pattern repeats, has interaction/accessibility logic, multiple states, or system-wide consistency risk.
5. Document or test important states: default, hover, focus, active, disabled, loading, invalid, error, long text, empty content, dark/light theme, and small viewport.
6. For global component changes, check downstream views and avoid changing shared behavior for one local case.

Read [references/guide.md](references/guide.md) for design-system checks and component description structure.
