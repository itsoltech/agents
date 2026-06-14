# tanstack-query-svelte-debugging Reference Sector: Overview

## Zawartość

- Overview
- Konfiguracja dla SvelteKit SSR
- Prefetch w SvelteKit przez `initialData`
- Prefetch w SvelteKit przez `prefetchQuery`


## Konfiguracja dla SvelteKit SSR

SvelteKit domyślnie renderuje trasy po stronie serwera. Jeżeli query ma uruchamiać się dopiero w przeglądarce, ustaw `enabled: browser` w domyślnych opcjach `QueryClient`.

```svelte
<script lang="ts">
  import { browser } from '$app/environment'
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

  let { children } = $props()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
      },
    },
  })
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
</QueryClientProvider>
```

Zasady dla SSR:

- nie zakładaj, że query powinno wykonywać się na serwerze tylko dlatego, że komponent jest renderowany przez SvelteKit
- do prefetchu danych w `load` używaj `queryClient.prefetchQuery`
- w `load` używaj `fetch` przekazanego przez SvelteKit, a nie globalnego `fetch`
- query wykonywane po stronie klienta powinno mieć ten sam `queryKey` i kompatybilny `queryFn` jak prefetch
- nie trzymaj jednego globalnego `QueryClient` współdzielonego między requestami SSR, jeśli dane zależą od użytkownika
- cache SSR nie może mieszać danych różnych użytkowników, tenantów albo sesji
- endpointy używane przez TanStack Query muszą być dostępne dla przeglądarki, jeśli query ma później refetchować dane po stronie klienta
## Prefetch w SvelteKit przez `initialData`

`initialData` jest prosty, ale słabszy przy współdzieleniu cache między komponentami.

```ts
// src/routes/users/+page.ts
import type { PageLoad } from './$types'
import { getUsers } from '$lib/api/users'

export const load: PageLoad = async ({ fetch }) => {
  const users = await getUsers({ fetch })

  return {
    users,
  }
}
```

```svelte
<!-- src/routes/users/+page.svelte -->
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { getUsers } from '$lib/api/users'
  import { usersKeys } from '$lib/queries/users.keys'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()

  const usersQuery = createQuery(() => ({
    queryKey: usersKeys.list(),
    queryFn: ({ signal }) => getUsers({ signal }),
    initialData: data.users,
  }))
</script>

{#if usersQuery.isPending}
  <p>Ładowanie...</p>
{:else if usersQuery.isError}
  <p>Nie udało się pobrać użytkowników.</p>
{:else}
  <ul>
    {#each usersQuery.data as user}
      <li>{user.name}</li>
    {/each}
  </ul>
{/if}
```

Stosuj `initialData`, gdy:

- dane są używane tylko w jednym miejscu
- nie chcesz budować pełnej konfiguracji prefetchu
- akceptujesz to, że czas pobrania danych jest liczony od załadowania strony, a nie od faktycznego fetchu na serwerze

Unikaj `initialData`, gdy:

- to samo query jest używane w kilku komponentach
- chcesz mieć jeden cache dostępny głębiej w drzewie
- zależy Ci na poprawnym `dataUpdatedAt`
- dane mają być prefetchowane dla wielu queries naraz
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
