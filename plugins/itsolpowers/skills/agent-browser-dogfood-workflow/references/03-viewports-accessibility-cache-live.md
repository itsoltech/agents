# Viewports Accessibility Cache Live

## Responsive And Environment Variants

Use the project's viewport matrix when one exists. If not, start with representative desktop, tablet, and mobile sizes.

Pattern:

```bash
agent-browser --session "${SESSION}" set viewport 1440 900
agent-browser --session "${SESSION}" set viewport 768 1024
agent-browser --session "${SESSION}" set viewport 390 844
```

Device emulation can be useful:

```bash
agent-browser --session "${SESSION}" set device "iPhone 14"
```

Check:

- layout does not overlap
- text is not clipped
- actions remain available
- modals fit in the viewport
- tables have a mobile strategy
- sticky headers or footers do not hide content
- scroll works in the intended container
- elements do not jump after loading
- focus does not move outside the visible area
- mobile menus close and restore focus
- orientation and resize do not lose form data

Color mode and motion patterns:

```bash
agent-browser --session "${SESSION}" set media dark
agent-browser --session "${SESSION}" set media light
agent-browser --session "${SESSION}" set media light reduced-motion
```

Device emulation is not a substitute for real-device checks when touch behavior, soft keyboard, safe areas, or browser-specific behavior matter.

## Accessibility Checks

The accessibility-tree snapshot helps catch naming, role, and structure issues. It is not a complete WCAG audit.

Check:

- complete flow can be run by keyboard
- focus order is logical
- focus is visible
- focus is not trapped except in intended modals
- focus returns after modal close
- icon buttons have accessible names
- form fields have labels
- field errors are associated with fields
- controls expose correct roles and states
- informative images have alt text
- headings are ordered logically
- status messages are announced or visible after actions
- reduced motion works
- no required content is hover-only
- drag and drop has an alternative method when needed
- focus is not hidden behind sticky UI

Keyboard pattern:

```bash
agent-browser --session "${SESSION}" press Tab
agent-browser --session "${SESSION}" snapshot -i
agent-browser --session "${SESSION}" press Tab
agent-browser --session "${SESSION}" press Enter
agent-browser --session "${SESSION}" press Shift+Tab
```

Report dogfood accessibility results as observations and findings, not as a conformance claim.

## Client State, Cache, And Live Events

For apps with cache, optimistic updates, WebSockets, or SSE, test:

- mutation updates the correct views
- invalidation does not leave stale detail data
- list and detail show the same data version
- reload confirms backend-persisted state
- mutation error rolls back optimistic UI
- submit action is guarded against double submit
- echoed self-event does not duplicate data
- duplicate event handling is idempotent
- event for another tenant does not alter current cache
- event for a hidden page does not create invalid visible state later
- reconnect performs resync
- missed event is repaired by refetch
- logout clears the previous user's data
- tenant change does not briefly show old tenant data
- second tab sees consistent state
- navigation during request does not write result into the wrong view
- older response does not overwrite newer state

Prioritize these checks for features that mutate shared data, use background updates, or depend on multi-tab consistency.
