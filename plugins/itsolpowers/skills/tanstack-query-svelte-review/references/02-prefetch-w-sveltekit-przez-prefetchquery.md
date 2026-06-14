# tanstack-query-svelte-review Reference Sector: Prefetch w SvelteKit przez `prefetchQuery`

## Zawartość

- Prefetch w SvelteKit przez `prefetchQuery`
- Domyślne zachowania v5

## Prefetch w SvelteKit przez `prefetchQuery`

`prefetchQuery` zapisuje wynik w cache `QueryClient`. Po stronie klienta `createQuery` może użyć danych z cache bez pierwszego fetchu.

```ts
// src/routes/+layout.ts
import { browser } from '$app/environment'
import { QueryClient } from '@tanstack/svelte-query'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
      },
    },
  })

  return {
    queryClient,
  }
}
```

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import type { LayoutData } from './$types'

  let { data, children }: { data: LayoutData; children: unknown } = $props()
</script>

<QueryClientProvider client={data.queryClient}>
  {@render children()}
</QueryClientProvider>
```

```ts
// src/routes/users/+page.ts
import type { PageLoad } from './$types'
import { getUsers } from '$lib/api/users'
import { usersKeys } from '$lib/queries/users.keys'

export const load: PageLoad = async ({ parent, fetch }) => {
  const { queryClient } = await parent()

  await queryClient.prefetchQuery({
    queryKey: usersKeys.list(),
    queryFn: () => getUsers({ fetch }),
  })
}
```

```svelte
<!-- src/routes/users/+page.svelte -->
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { getUsers } from '$lib/api/users'
  import { usersKeys } from '$lib/queries/users.keys'

  const usersQuery = createQuery(() => ({
    queryKey: usersKeys.list(),
    queryFn: ({ signal }) => getUsers({ signal }),
  }))
</script>
```

Zasady:

- `queryKey` w `prefetchQuery` i `createQuery` musi być identyczny
- `queryFn` powinien zwracać ten sam kształt danych po stronie serwera i klienta
- w `load` używaj `fetch` ze SvelteKit
- nie używaj `+page.server.ts`, jeśli query ma później wykonać ten sam endpoint bezpośrednio w przeglądarce
- nie prefetchuj danych zależnych od prywatnych uprawnień do cache, który może zostać współdzielony między użytkownikami
## Domyślne zachowania v5

TanStack Query domyślnie traktuje dane jako stale. To oznacza, że query może refetchować przy montowaniu komponentu, odzyskaniu focusu okna albo ponownym połączeniu z siecią.

Najważniejsze domyślne zachowania:

- `staleTime` domyślnie wynosi `0`
- nieaktywne query pozostają w cache przez `gcTime`, domyślnie około 5 minut
- query po błędzie jest retryowane domyślnie kilka razy po stronie klienta
- query może wykonać refetch przy focusie okna, reconnect i remount
- structural sharing jest domyślnie włączony dla danych kompatybilnych z JSON
- w v5 `cacheTime` zostało zastąpione przez `gcTime`
- w v5 status `loading` został zastąpiony przez `pending`
- w mutacjach używaj `isPending`, nie `isLoading`

Standardy projektu powinny jawnie określać:

- domyślny `staleTime` dla słowników, list, szczegółów i danych użytkownika
- domyślny `gcTime` dla danych krótkich i danych ciężkich
- politykę `retry` dla błędów 4xx, 5xx i problemów sieciowych
- zachowanie `refetchOnWindowFocus`
- zachowanie `refetchOnReconnect`
- zasady prefetchu i invalidacji po mutacjach

Przykład bezpieczniejszego retry:

```ts
import { QueryClient } from '@tanstack/svelte-query'
import { ApiError } from '$lib/api/api-error'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false
        }

        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
```
