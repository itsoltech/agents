# tanstack-query-svelte-review Reference Sector: Query keys

## Zawartość

- Query keys
- Query options factory
- `createQuery`

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
## Query options factory

Dla powtarzalnych queries używaj `queryOptions`. Dzięki temu konfiguracja query, key i fetcher są w jednym miejscu.

```ts
// src/lib/queries/users.queries.ts
import { queryOptions } from '@tanstack/svelte-query'
import { getUser, getUsers } from '$lib/api/users'
import { usersKeys, type UsersListFilters } from './users.keys'

export const usersQueries = {
  list: (filters: UsersListFilters = {}) =>
    queryOptions({
      queryKey: usersKeys.list(filters),
      queryFn: ({ signal }) => getUsers({ filters, signal }),
      staleTime: 30_000,
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: usersKeys.detail(id),
      queryFn: ({ signal }) => getUser(id, { signal }),
      staleTime: 60_000,
    }),
}
```

Użycie w komponencie:

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { usersQueries } from '$lib/queries/users.queries'

  let { userId }: { userId: string } = $props()

  const userQuery = createQuery(() => usersQueries.detail(userId))
</script>
```

Zasady:

- query options factory nie powinna czytać stanu UI bezpośrednio
- query options factory może przyjmować parametry i zwracać gotowe opcje
- nie mieszaj budowania key, fetchera i transformacji danych w każdym komponencie osobno
- jeśli ten sam endpoint jest używany w wielu miejscach, stwórz factory
- jeśli query jest jednorazowe i lokalne dla jednego komponentu, factory nie jest wymagana
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
