# Forms, Scroll, Modals, Tabs, And Iframes

## Scroll Troubleshooting

First prove whether content extends beyond the viewport. A full-page screenshot plus full snapshot can show whether the page is already fully visible.

Pattern:

```bash
agent-browser --session "$SESSION" screenshot --full "$OUT/screenshots/scroll-full.png"
agent-browser --session "$SESSION" snapshot
```

Then test the likely scroll target:

- page scroll
- nested scroll container
- scroll-to-element behavior
- mouse wheel behavior
- keyboard or touch behavior when relevant
- headed mode when hidden native scrollbars make headless evidence ambiguous

Check for `overflow: hidden`, body lock, fixed overlays, invisible backdrops, sticky headers, focus traps, nested scroll regions, mobile viewport locks, `100vh` panels, and virtualized lists.

Classify as a product issue when reachable content cannot be reached by a real user, scroll remains locked after modal close, sticky elements hide data, wheel/touch/keyboard behavior is broken, focus moves to invisible content, virtualized lists skip or duplicate items, or scroll position resets without a product reason.

Classify as tooling or test setup when the headed manual check works, the command targeted the wrong container, the ref was stale, the element was not rendered yet, the screenshot hid scrollbars but scrolling worked, or the issue only appeared after diagnostic JavaScript.

Do not use JavaScript scroll as the first fix. It can hide real user-event problems.

## Existing But Hidden Element

Check visibility, box geometry, and whether the element can be scrolled into view.

Pattern:

```bash
agent-browser --session "$SESSION" is visible @e5
agent-browser --session "$SESSION" get box @e5
agent-browser --session "$SESSION" scrollintoview @e5
```

Then verify:

- loader or skeleton state
- full snapshot content
- collapsed panel, tab, drawer, modal, or iframe context
- viewport size and zoom-sensitive layout
- role, permissions, feature flags, and data prerequisites
- virtualized list behavior

Hidden or absent content may be correct for the current user, role, data, or feature flag. Confirm the expected behavior before filing a product bug.

## Forms And Custom Inputs

For an input issue, verify focus, value, and the event model. Use fill for normal inputs, typed keyboard events for custom inputs, and inserted text when the component handles text insertion differently.

Pattern:

```bash
agent-browser --session "$SESSION" focus @e4
agent-browser --session "$SESSION" fill @e4 "value"
agent-browser --session "$SESSION" get value @e4
```

If the visible field still does not accept data, check:

- disabled or readonly state
- focus landing on the correct internal element
- iframe context
- input mask, formatter, or autocomplete overwriting the value
- validation that runs only after blur
- combobox, date picker, or menu selection expected instead of free text
- role or permission constraints

Report which input method matched human behavior. `fill`, keyboard typing, and text insertion can trigger different events.

## Modals, Dialogs, Popups, And Tabs

After opening or closing a modal, dialog, popup, or tab, take a new snapshot before using refs.

For JavaScript dialogs, inspect current dialog state and accept or dismiss only as the user scenario requires. For new tabs, list tabs, switch explicitly, snapshot, interact, then return to the opener if the flow requires it.

Check:

- popup was triggered by the intended user action
- opener retained expected state
- external URL is allowed for the flow
- user can return without data loss
- focus lands inside the dialog and returns logically on close
- overlays, banners, tooltips, or backdrops do not block unrelated clicks
- no sensitive data leaks through a new tab relationship

Use UI controls to close overlays. Do not remove overlays with eval; that bypasses the behavior under test.

## Iframes

When an element is inside a frame, switch frame context, take a fresh interactive snapshot, perform the interaction, then switch back to the main frame and snapshot again.

Pattern:

```bash
agent-browser --session "$SESSION" frame @e3
agent-browser --session "$SESSION" snapshot -i
agent-browser --session "$SESSION" frame main
agent-browser --session "$SESSION" snapshot -i
```

Cross-origin frames can limit automation visibility. Do not call the product broken solely because automation cannot inspect frame contents. Verify headed behavior, visible UI, console/network evidence, and the expected user contract.
