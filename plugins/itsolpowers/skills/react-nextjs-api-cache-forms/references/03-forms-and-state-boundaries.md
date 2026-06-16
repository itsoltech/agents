# Forms And State Boundaries

## Forms

Use simple Server Functions plus `useActionState` and `useFormStatus` for simple Next.js forms.

Use client-side form tooling for complex forms:

- React Hook Form;
- Zod, Valibot, or another runtime validator;
- TanStack Query mutations;
- generated Hey API client.

Rules:

- Client validation improves UX but never replaces backend validation.
- Field errors should map to fields.
- General errors should appear in a visible place.
- Do not reset the form after failed mutation.
- Do not clear user input on network errors.
- Block double submit or use idempotency keys.
- Inputs need labels and keyboard access.
- Field errors need `aria-describedby`.
- Do not show raw backend errors, stack traces, SQL errors, or internal codes unless explicitly safe.

## State Boundaries

- Local UI state: `useState`, `useReducer`.
- Derived state: normal calculations or measured `useMemo`.
- Server state: TanStack Query.
- URL state: search params and dynamic route params.
- Global UI state: Context, Zustand, Jotai, or similar lightweight store.
- Form state: form library or local reducer.
- Auth/session state: server/session provider, not an arbitrary global store.

Do not keep server state in global store. Do not copy TanStack Query data into local state unless editing a draft. Clear user-scoped cache and state on logout.
