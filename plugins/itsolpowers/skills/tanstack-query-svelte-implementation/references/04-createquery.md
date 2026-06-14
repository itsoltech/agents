# tanstack-query-svelte-implementation Reference Sector: `createQuery`

## Zawartość

- `createQuery`
- Reaktywność w Svelte
- Statusy query w v5
- `enabled` i queries zależne

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
## Reaktywność w Svelte

W adapterze Svelte v5 opcje `createQuery`, `createMutation`, `createInfiniteQuery` i podobnych funkcji powinny być opakowane w funkcję. Dzięki temu adapter może śledzić wartości odczytane wewnątrz konfiguracji.

Dobrze:

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { getUser } from '$lib/api/users'
  import { usersKeys } from '$lib/queries/users.keys'

  let { userId }: { userId: string } = $props()

  const userQuery = createQuery(() => ({
    queryKey: usersKeys.detail(userId),
    queryFn: ({ signal }) => getUser(userId, { signal }),
    enabled: Boolean(userId),
  }))
</script>
```

Źle:

```svelte
<script lang="ts">
  const userQuery = createQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: ({ signal }) => getUser(userId, { signal }),
  })
</script>
```

Zasady:

- nie wynoś reaktywnych wartości poza funkcję opcji, jeśli mają zmieniać query
- wszystkie zmienne użyte w `queryFn` dodaj do `queryKey`
- nie twórz query key raz poza funkcją, jeśli zależy od propsów albo URL params
- unikaj destrukturyzacji wyniku query w sposób, który utrudnia reaktywność albo tracking
- w template czytaj `userQuery.data`, `userQuery.isPending`, `userQuery.isError`
- jeśli tworzysz `$derived`, opieraj go na polach query, a nie na jednorazowo skopiowanych wartościach
## Statusy query w v5

Najczęściej używane pola:

- `isPending` oznacza brak danych i oczekiwanie na pierwszy wynik
- `isFetching` oznacza dowolny aktywny fetch, także background refetch
- `isRefetching` oznacza fetch po tym, jak dane już istnieją
- `isError` oznacza błąd ostatniego wykonania
- `isSuccess` oznacza poprawnie pobrane dane
- `data` zawiera dane query, jeśli są dostępne
- `error` zawiera błąd, jeśli query zakończyło się błędem

Zasady UI:

- dla pierwszego ładowania używaj `isPending`
- dla odświeżania istniejących danych używaj `isFetching` albo `isRefetching`
- nie chowaj istniejących danych tylko dlatego, że trwa background refetch
- pokazuj mały indikator odświeżania, jeśli dane są widoczne i trwa refetch
- obsługuj stan pustej listy osobno od stanu loading
- nie zakładaj, że `error` jest zawsze `ApiError`; sprawdzaj typ błędu

Przykład:

```svelte
{#if usersQuery.isPending}
  <UsersSkeleton />
{:else if usersQuery.isError}
  <ErrorPanel error={usersQuery.error} onRetry={() => usersQuery.refetch()} />
{:else}
  <UsersTable users={usersQuery.data} />

  {#if usersQuery.isFetching}
    <SmallRefreshIndicator />
  {/if}
{/if}
```
## `enabled` i queries zależne

`enabled` blokuje automatyczne wykonanie query. Używaj go dla query zależnych od danych, których jeszcze nie ma.

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { getUserProjects } from '$lib/api/projects'
  import { projectKeys } from '$lib/queries/projects.keys'

  let { userId }: { userId?: string } = $props()

  const projectsQuery = createQuery(() => ({
    queryKey: projectKeys.byUser(userId ?? 'missing'),
    queryFn: ({ signal }) => getUserProjects(userId!, { signal }),
    enabled: Boolean(userId),
  }))
</script>
```

Zasady:

- używaj `enabled`, gdy query wymaga `id`, tokenu, filtra albo danych z innego query
- nie wywołuj `queryFn` z pustym stringiem tylko po to, żeby uniknąć TypeScript error
- query key nadal powinien być stabilny i przewidywalny, nawet gdy query jest disabled
- disabled query nie reaguje normalnie na invalidacje, dopóki pozostaje disabled
- nie używaj `enabled: false` jako domyślnego trybu imperatywnego pobierania danych
- jeśli query ma wystartować po kliknięciu, sprawdź, czy nie lepiej modelować kliknięcia jako zmianę parametrów query
