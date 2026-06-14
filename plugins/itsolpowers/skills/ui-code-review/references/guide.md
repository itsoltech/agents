# UI Code Review Guide

## What To Review

- Existing components and tokens are reused.
- New components are necessary and have simple APIs.
- Variants are semantic.
- Tailwind classes use tokens and avoid random values.
- All relevant UI states are handled.
- Accessibility and keyboard behavior work.
- Responsive layouts are intentional.
- Layout does not shift during loading/refetch.
- Animations are justified and respect reduced motion.
- Tests cover user-visible behavior.
- Errors, empty states and disabled states are understandable.
- Security-sensitive rendering avoids untrusted HTML and unsafe links.
- Component responsibilities are not mixed.
- Performance is reasonable for realistic data.

## Reviewer Questions

- Does this look like the same application?
- Does a similar pattern already exist?
- Should the new component enter the design system?
- Does the variant name describe intent?
- Can a user complete the action without a mouse?
- Can a screen reader user understand the form?
- Does the view work with empty data?
- Does background refetch preserve user context?
- Is mobile an intentional layout, not a squeezed desktop?
- Does long text break anything?
- Does the loading state match final dimensions?
- Does animation explain state or hide a performance issue?
- Does the test verify behavior instead of implementation?

## Large PR Subagent Split

For large UI PRs, use focused review subagents:

- `ui-design-system` for tokens, variants, base components and consistency;
- `ui-component-architecture` for decomposition and ownership;
- `ui-view-states-forms` for states, forms, tables, API/cache and optimistic UI;
- `ui-responsive-media` for mobile/tablet/desktop/media behavior;
- `ui-tailwind-tokens` for utility class and token usage;
- `ui-accessibility-motion` for keyboard, focus, ARIA and reduced motion;
- `ui-performance-stability` for CLS, Core Web Vitals, large lists and heavy imports;
- `ui-frontend-testing-qa` for tests, visual regression and QA evidence;
- `security-frontend-browser-review` when rendering, storage, links, uploads, auth state, CSP or browser trust boundary changes.

The main agent consolidates findings, removes duplicates, orders by severity and states coverage gaps.

## Minimum Blocking Risks

Consider blocking when:

- primary flow has no loading/error/empty state;
- form lacks labels or visible field errors;
- primary action is unavailable by keyboard or mobile;
- UI exposes action/data without backend enforcement evidence;
- untrusted HTML is rendered without security review;
- responsive layout has unusable horizontal scroll;
- layout shift breaks task flow;
- new base component lacks accessible behavior or tests;
- critical UI behavior has no verification.
