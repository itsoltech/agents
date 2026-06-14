---
name: ui-accessibility-motion
description: "UI accessibility/motion: semantic HTML, keyboard, focus, ARIA, labels, reduced motion."
---

# UI Accessibility Motion

Make the UI semantically correct and operable before polishing visual motion.

## Process

1. Prefer semantic HTML over ARIA; do not use ARIA to repair bad structure.
2. Use buttons for actions and links for navigation.
3. Ensure every form control has a label and field errors are associated with the control.
4. Verify keyboard navigation, focus order, visible focus, modal focus trap, Escape behavior, Enter/Space activation and post-action focus.
5. Use ARIA only when native semantics are insufficient; avoid hiding focusable elements with `aria-hidden`.
6. Do not communicate meaning only through color, hover, animation, icon or tooltip.
7. Respect reduced motion and provide low-motion alternatives for large movement, parallax, zoom and long transitions.
8. Use animation only when it explains state, relationship, progress or feedback; avoid animation that blocks work, hides slow APIs or causes reflow.

Read [references/guide.md](references/guide.md) for accessibility and motion checks.
