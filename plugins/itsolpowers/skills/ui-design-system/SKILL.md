---
name: ui-design-system
description: "Design UI tokens, primitives, variants, states, composition, and consistency rules."
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

## Consistency Rules

- Search existing patterns first.
- Do not add one-off colors, spacing, typography, radius or shadows.
- One action type should look the same across the app.
- Disabled, loading, active, selected, invalid and readonly states should be consistent.
- Errors, toasts and empty states should share tone and structure.
- Dropdowns, modals, tooltips, popovers and comboboxes should share keyboard behavior.
- Lists, tables and detail layouts should share spacing rhythm.

## Sources Of Truth

Healthy projects should have:

- design tokens;
- base components;
- domain components;
- component examples or Storybook stories;
- responsive rules;
- animation rules;
- form/message rules;
- visual tests for high-use components.

If a mockup conflicts with the design system, decide whether it is a system change, a local exception, or a design mistake before implementation.

## Base Component Checklist

A base component should have:

- stable props API;
- semantic variants and sizes;
- sensible defaults;
- forwarding for relevant HTML attributes, `aria-*`, `data-*`, `id` and `class`;
- `disabled`, `loading`, `invalid` support where applicable;
- visible focus and keyboard support;
- behavior tests and examples;
- long-text, error, disabled and small-viewport examples.

Avoid a new base component when the element is used once, has no interaction model, is only a `div` wrapper, or can be composed from existing components.

## Component Description Template

```markdown
# ComponentName

## Purpose
What the component is for.

## When Not To Use
Cases where another component is better.

## Variants
- primary
- secondary
- danger

## States
- default
- hover
- focus
- active
- disabled
- loading
- error

## Accessibility
Role, keyboard behavior, ARIA and focus management.

## Responsiveness
Behavior on narrow screens.

## Examples
Default, long text, icon, disabled, loading and error.
```
