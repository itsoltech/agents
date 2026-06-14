---
name: ui-tailwind-tokens
description: Use when implementing or reviewing Tailwind CSS, design tokens, theme variables, utility class strategy, semantic colors, spacing/radius/shadow scales, component variants, class composition, arbitrary values, `@apply`, responsive utilities, cva/clsx/tailwind-merge usage, or Tailwind consistency in a frontend project.
---

# UI Tailwind Tokens

Use Tailwind through the project's design tokens and component variants, not as a collection of one-off values.

## Process

1. Inspect the project's Tailwind version, theme setup, tokens, helpers and component variant patterns before editing.
2. Prefer semantic tokens and shared scales for color, spacing, radius, typography, z-index and motion.
3. Treat arbitrary values as exceptions; promote repeated values to tokens.
4. Put state styles such as disabled, focus, hover and active into base components or variants.
5. Use semantic variant names that describe intent, not color.
6. Keep responsive utilities readable and test every breakpoint added.
7. Use `@apply` only for semantic content styling, third-party generated markup, global rich text, or places where a component is impractical.

Read [references/guide.md](references/guide.md) for Tailwind rules.
