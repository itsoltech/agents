# UI Accessibility Motion Guide

## Accessibility Rules

- Use semantic HTML first.
- Clickable elements are `button` or links, not `div` with click handlers.
- Every input has a label.
- Focus state is visible.
- UI works without hover.
- Modals manage focus and return focus to the opener.
- Menus, comboboxes, tabs and dialogs support keyboard patterns.
- Do not communicate meaning only with color.
- Text has sufficient contrast.
- Dynamic messages use live regions only when screen reader users need them.
- Touch targets are large enough.
- Test zoom at 200 percent.

## Keyboard Checklist

- Tab and Shift+Tab traverse the screen.
- Focus order matches visual and logical layout.
- Focus does not enter hidden elements.
- Modal traps focus.
- Escape closes modal/menu when expected.
- Enter/Space activate buttons.
- Tooltip/popover does not hide content on focus.
- After an action, focus moves somewhere sensible.

## ARIA Rules

- Do not add `role` when the native element already has semantics.
- Do not put `aria-hidden` on a parent of focusable elements.
- Do not use `aria-label` when visible text can label the control.
- `aria-live` is only for messages that must be announced.
- `aria-disabled` does not block interaction by itself.
- Native select is preferred when custom combobox behavior is not necessary.

## Motion Rules

Good animation:

- shows relationship between states;
- gives feedback after action;
- reduces abrupt changes;
- guides attention;
- shows progress or reordering.

Risky animation:

- delays task completion;
- blocks interaction;
- animates layout properties instead of `transform`/`opacity`;
- runs on every render;
- ignores reduced motion;
- hides slow API instead of improving loading state.

Use shared motion tokens for duration, easing and distance. For reduced motion, reduce distance, scaling, parallax and long transitions without removing needed feedback.
