---
name: ui-responsive-media
description: "Responsive UI/media: mobile, tablet, desktop, breakpoints, touch, zoom, images, iframes."
---

# UI Responsive Media

Responsive design adapts layout, priorities and interaction model to the device. It is not just a smaller desktop.

## Process

1. Decide what information and actions are needed first on small screens.
2. Design content flow before choosing breakpoints; use flex/grid/min/max/container constraints.
3. Prefer one responsive implementation unless mobile and desktop interaction models are genuinely different.
4. Convert dense desktop patterns intentionally: tables to cards, filters to drawers/bottom sheets, sidebars to contextual nav, detail panels to separate screens or expanded cards.
5. Use max-widths and additional context on desktop instead of stretching mobile layouts.
6. Set stable dimensions or aspect ratios for images, videos, iframes, avatars, thumbnails, charts and media placeholders.
7. Test real viewport sizes, landscape mobile, zoom, long text, touch, keyboard, soft keyboard and safe areas.

Read [references/guide.md](references/guide.md) for responsive review rules.
