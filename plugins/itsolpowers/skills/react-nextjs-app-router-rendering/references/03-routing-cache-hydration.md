# Routing Cache And Hydration

## Routing, Layouts, And Boundaries

- Use route groups for organization and layout composition, not as security boundaries.
- Validate dynamic route params before API use.
- Treat search params as user input.
- Add `loading.tsx` where requests can visibly wait.
- Add `error.tsx` where a route segment needs isolated recovery.
- Add `not-found.tsx` for dynamic resource routes.
- Keep root layout lean; do not fetch heavy data there unless every route needs it.
- Design navigation after mutation explicitly: stay, redirect, replace, optimistic transition, toast, or refresh.
- Do not use navigation alone as save confirmation.

## Cache And Hydration

- Use Next.js cache for server-side data and render caching.
- Use TanStack Query for client-side server state, filters, pagination, polling, live events, optimistic updates, and refetching.
- Do not fetch the same data in Server Components and TanStack Query without a hydration or revalidation plan.
- Do not cache private user/tenant data globally without scope.
- Avoid `router.refresh()` as a generic mutation hammer.
- Remember that client-side invalidation does not automatically invalidate Next.js server cache.
- For SSR/hydration with TanStack Query, create one server QueryClient per request and hydrate only client-safe data.

## Hydration Risk Checklist

- no time/random/locale/media-query mismatch in initial render;
- no storage-dependent branch changing initial DOM;
- no browser-only package imported server-side;
- no server-only package imported client-side;
- no non-serializable props crossing server/client boundary;
- skeletons, images, fonts, embeds, and headers have stable dimensions.
