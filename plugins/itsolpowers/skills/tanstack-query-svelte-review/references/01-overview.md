# tanstack-query-svelte-review Reference Sector: Overview

## Zawartość

- Overview
- Kiedy używać TanStack Query
- Minimalna konfiguracja klienta
- Konfiguracja dla SvelteKit SSR
- Prefetch w SvelteKit przez `initialData`


## Kiedy używać TanStack Query

TanStack Query powinien obsługiwać dane serwerowe: dane pobierane z API, cache, refetch, retry, invalidację, synchronizację po mutacjach i obsługę stanu requestów.

Nie używaj TanStack Query jako zamiennika dla całego state managementu aplikacji.

TanStack Query pasuje do:

- danych pobieranych z REST, GraphQL, RPC, SvelteKit endpoints albo zewnętrznego API
- danych współdzielonych przez wiele komponentów
- list, szczegółów, słowników, ustawień użytkownika i danych sesji czytanych z backendu
- requestów wymagających cache, retry, prefetch, invalidacji albo deduplikacji
- mutacji tworzących, zmieniających albo usuwających dane na serwerze

TanStack Query nie powinien obsługiwać:

- lokalnego stanu formularza przed wysłaniem
- stanu UI typu otwarty modal, aktywny tab, hover, lokalny filtr bez API
- danych tymczasowych zależnych tylko od komponentu
- bardzo częstego strumienia danych, jeśli prostszy store albo WebSocket handler lepiej pasuje do problemu
- sekretów, tokenów i danych, które nie powinny trafić do cache po stronie przeglądarki
## Minimalna konfiguracja klienta

W aplikacji SPA można utworzyć jednego `QueryClient` przy starcie aplikacji i przekazać go przez `QueryClientProvider`.

```svelte
<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

  let { children } = $props()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
</script>

<QueryClientProvider client={queryClient}>
  {@render children()}
</QueryClientProvider>
```

Zasady:

- twórz `QueryClient` raz dla drzewa aplikacji, nie w każdym komponencie
- nie twórz `new QueryClient()` w funkcji renderującej listę albo w komponencie wielokrotnie montowanym
- nie konfiguruj domyślnych opcji losowo per komponent
- trzymaj standardy `staleTime`, `gcTime`, retry i refetch w jednym miejscu
- `QueryClientProvider` powinien znajdować się możliwie wysoko w drzewie aplikacji
- jeśli masz kilka niezależnych aplikacji na jednej stronie, każda może mieć własny `QueryClient`
- w microfrontendach ustal jawnie, czy cache ma być wspólny, czy izolowany
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
