# UI Design System Guide

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
