---
name: ui-performance-stability
description: "UI performance/stability: Web Vitals, LCP, INP, CLS, layout shift, bundles, large lists."
---

# UI Performance Stability

Frontend performance is part of UX. The interface should stay responsive and visually stable with realistic data and slow networks.

## Process

1. Identify performance-sensitive surfaces: first viewport, LCP element, large lists, tables, charts, forms, third-party scripts, images, fonts, and async sections.
2. Reserve dimensions for images, iframes, skeletons, cards, avatars, charts, alerts and lazy-loaded components.
3. Avoid adding content above the user's current reading position unless caused by direct user action.
4. Limit initial JS and lazy load heavy views, libraries and non-critical media.
5. Avoid rendering thousands of elements without pagination or virtualization.
6. Avoid expensive filtering/sorting/parsing in render paths.
7. Distinguish server state from client state and avoid request waterfalls.
8. Test with realistic record counts, weak devices, slow API, background refetch and retries.

Read [references/guide.md](references/guide.md) for CLS and performance checklists.
