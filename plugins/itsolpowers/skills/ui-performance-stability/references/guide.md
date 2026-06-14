# UI Performance Stability Guide

## Layout Shift Causes

- images or iframes without dimensions;
- ads, embeds or charts without reserved space;
- font metric changes after load;
- skeleton size different from final UI;
- late alert/banner above content;
- lazy component with unknown height;
- tables changing column widths after data arrives;
- conditional rendering without stable container;
- validation errors changing input heights.

## CLS Rules

- Set width/height or `aspect-ratio` for images and media.
- Set min-height for async sections.
- Match skeleton size to final UI.
- Reserve space for toasts, banners and sticky elements when they can affect layout.
- Avoid shifting content above what the user is reading.
- Keep table column widths/wrapping predictable.
- Reserve error-message space or render errors without moving the whole form.
- Use stable dimensions for avatars and icons.

## Performance Rules

- Limit JS on first entry.
- Lazy load heavy views and libraries.
- Do not import a whole icon library for a few icons.
- Use pagination or virtualization for large lists.
- Avoid expensive calculations in render.
- Memoize only when cost and dependencies are understood.
- Do not put all state in global state.
- Use API cache but avoid hiding auth/permission changes.
- Avoid request waterfalls.
- Prefetch only when likely to be used.
- Optimize images, fonts and third-party scripts.
- Measure on weaker devices.

## Component Performance

Watch for:

- constantly recreated objects in deep trees;
- costly inline callbacks in huge lists;
- sorting/filtering on every render;
- hidden but still rendered huge DOM;
- drag-and-drop with large lists;
- charts with too many points;
- rich text parsers running repeatedly.
