# tanstack-query-svelte-debugging Reference Sector: Domyślne zachowania v5

## Zawartość

- Domyślne zachowania v5
- Query keys
- `createQuery`

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
## Query keys

Query key jest adresem danych w cache. Źle zaprojektowane query keys powodują błędną invalidację, mieszanie danych i trudne błędy UI.

Zasady:

- query key zawsze powinien być tablicą
- query key musi jednoznacznie opisywać dane zwracane przez `queryFn`
- wszystkie zmienne użyte przez `queryFn` powinny znaleźć się w `queryKey`
- query key musi być serializowalny
- nie wkładaj do query key funkcji, klas, obiektów DOM, instancji `Date` bez normalizacji albo całych obiektów formularza
- nie wkładaj tokenów auth, sekretów ani pełnych nagłówków do query key
- dla danych zależnych od tenanta dodawaj `tenantId`
- dla danych zależnych od użytkownika dodawaj zakres użytkownika albo upewnij się, że cache jest czyszczony przy logout
- parametry filtrów normalizuj: sortowanie, puste wartości, `undefined`, kolejność tablic
- trzymaj query keys w factory, nie jako losowe tablice rozsiane po komponentach

Przykład factory:

```ts
// src/lib/queries/users.keys.ts
export type UsersListFilters = {
  search?: string
  role?: string
  page?: number
  pageSize?: number
}

const normalizeUsersFilters = (filters: UsersListFilters) => ({
  search: filters.search?.trim() || undefined,
  role: filters.role || undefined,
  page: filters.page ?? 1,
  pageSize: filters.pageSize ?? 25,
})

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (filters: UsersListFilters = {}) =>
    [...usersKeys.lists(), normalizeUsersFilters(filters)] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
}
```

Przykłady złe:

```ts
queryKey: ['users', filters]
queryKey: ['users', new Date()]
queryKey: ['users', () => selectedRole]
queryKey: ['users', accessToken]
queryKey: ['users'] // dla listy zależnej od search, page, tenantId
```

Przykłady dobre:

```ts
queryKey: usersKeys.list({ search, role, page, pageSize })
queryKey: usersKeys.detail(userId)
queryKey: ['tenant', tenantId, 'users', 'list', normalizedFilters]
```
## `createQuery`

Podstawowe query:

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { getUsers } from '$lib/api/users'
  import { usersKeys } from '$lib/queries/users.keys'

  const usersQuery = createQuery(() => ({
    queryKey: usersKeys.list(),
    queryFn: ({ signal }) => getUsers({ signal }),
  }))
</script>

{#if usersQuery.isPending}
  <p>Ładowanie...</p>
{:else if usersQuery.isError}
  <p>Nie udało się pobrać danych.</p>
{:else}
  <ul>
    {#each usersQuery.data as user}
      <li>{user.name}</li>
    {/each}
  </ul>
{/if}
```

Zasady:

- opcje `createQuery` przekazuj jako funkcję: `createQuery(() => ({ ... }))`
- parametry reaktywne odczytuj wewnątrz funkcji opcji
- `queryFn` nie może zwracać `undefined`
- `queryFn` powinien rzucać błąd dla nieudanego requestu
- nie wykonuj side effectów w `queryFn` poza pobraniem danych
- nie rób mutacji danych w `queryFn`
- nie używaj `createQuery` do operacji zapisujących dane na serwerze
- nie kopiuj `query.data` do lokalnego stanu bez powodu
- nie nadpisuj ręcznie stanu loading/error zamiast korzystać ze stanu query
- nie ignoruj `signal` przekazanego do `queryFn`, jeśli używasz `fetch`
