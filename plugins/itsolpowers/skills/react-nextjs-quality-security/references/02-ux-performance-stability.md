# UX Performance And Stability

## Accessibility And UX Quality

- Inputs need labels or accessible names.
- Clickable actions should use `button`; navigation should use `a`/Link with href.
- Avoid `div` buttons unless full keyboard and ARIA behavior is implemented.
- Focus state must be visible.
- Dialogs trap focus and return focus after close.
- Menus, comboboxes, tabs, and tooltips should use proven accessible primitives or correct WAI-ARIA patterns.
- Color cannot be the only information channel.
- Field errors must be readable by assistive tech.
- Use `aria-live` only for dynamic messages users need to hear.
- Respect `prefers-reduced-motion`.
- Test keyboard flows for critical actions.

## Performance And Stability

Measure before optimizing. Check:

- bundle size and client JavaScript amount;
- number and placement of Client Components;
- request waterfalls;
- Core Web Vitals;
- hydration cost;
- API payload size;
- re-render count;
- table, list, form, chart, editor, map, and datepicker cost;
- dependency size and transitive dependencies.

Rules:

- Use Server Components to reduce client JS where possible.
- Do not place `'use client'` high in the tree without a reason.
- Load heavy client libraries dynamically when not required for first render.
- Use `next/image` where appropriate and define image dimensions or stable `fill` containers.
- Avoid client request waterfalls that server composition can eliminate.
- Do not render thousands of rows without pagination or virtualization.
- React Compiler may reduce manual memoization but does not fix wrong data architecture.
- Analyze bundle before adding large dependencies.

## Layout Shift

- Images need known dimensions or stable aspect ratio.
- Skeletons should match final content height.
- Fonts should use Next.js mechanisms or controlled fallbacks.
- Ads, iframes, maps, embeds, and widgets need reserved space.
- Conditional components should not push layout after hydration.
- Header height should not change after data load.
- Toasts/modals should not shift main content.
- Avoid server/client render differences that create hydration mismatch and visual jumps.
