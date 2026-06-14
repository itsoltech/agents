# tanstack-query-svelte-debugging Reference Sector: Paginacja

## Zawartość

- Paginacja
- Infinite queries
- Polling, refetch i realtime
- Cache a auth, logout i tenant
- Obsługa błędów

## Paginacja

Dla paginacji klasycznej dodawaj numer strony, rozmiar strony i filtry do query key.

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { getUsers } from '$lib/api/users'
  import { usersKeys } from '$lib/queries/users.keys'

  let page = $state(1)
  let pageSize = $state(25)
  let search = $state('')

  const usersQuery = createQuery(() => ({
    queryKey: usersKeys.list({ page, pageSize, search }),
    queryFn: ({ signal }) => getUsers({ filters: { page, pageSize, search }, signal }),
    placeholderData: (previousData) => previousData,
  }))
</script>
```

Zasady:

- wszystkie parametry paginacji muszą być w query key
- dla zmiany strony możesz użyć `placeholderData: (previousData) => previousData`, żeby zachować poprzednie dane podczas fetchu
- nie używaj starego `keepPreviousData: true` z v4
- przy `placeholderData` rozróżniaj dane prawdziwe i placeholder przez `isPlaceholderData`
- przy dużych tabelach backend powinien wspierać keyset pagination albo cursor pagination
- nie pobieraj tysięcy rekordów tylko po to, żeby paginować w przeglądarce
- parametry z URL search params normalizuj przed przekazaniem do query key
## Infinite queries

`createInfiniteQuery` służy do list ładowanych stronami, np. infinite scroll albo przycisk "Pokaż więcej".

```svelte
<script lang="ts">
  import { createInfiniteQuery } from '@tanstack/svelte-query'
  import { getUsersPage } from '$lib/api/users'

  const usersQuery = createInfiniteQuery(() => ({
    queryKey: ['users', 'infinite'],
    queryFn: ({ pageParam, signal }) => getUsersPage({ cursor: pageParam, signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  }))
</script>

{#if usersQuery.isSuccess}
  {#each usersQuery.data.pages as page}
    {#each page.items as user}
      <UserRow user={user} />
    {/each}
  {/each}
{/if}

<button
  disabled={!usersQuery.hasNextPage || usersQuery.isFetchingNextPage}
  onclick={() => usersQuery.fetchNextPage()}
>
  Pokaż więcej
</button>
```

Zasady:

- w v5 `initialPageParam` jest wymagany
- `getNextPageParam` powinien zwracać następny cursor albo `null` / `undefined`, gdy nie ma kolejnej strony
- nie przekazuj ręcznie losowego `pageParam` do `fetchNextPage`, jeśli model danych powinien wynikać z `getNextPageParam`
- dane infinite query muszą mieć kształt `{ pages, pageParams }`, jeśli ustawiasz `initialData` albo `placeholderData`
- nie renderuj bardzo długiej listy bez wirtualizacji
- przy infinite scroll dodaj throttle/debounce na observer albo scroll handler
- obsługuj osobno `isFetchingNextPage` i pierwsze `isPending`
- po zmianie filtrów query key musi się zmienić, żeby lista nie mieszała wyników
- przy pamięciożernych listach rozważ `maxPages`
## Polling, refetch i realtime

TanStack Query obsługuje polling przez `refetchInterval`, ale nie każdy realtime powinien być pollingiem.

Zasady:

- używaj `refetchInterval` dla danych, które mogą być odświeżane okresowo bez dużego kosztu
- nie ustawiaj krótkiego pollingu globalnie
- wyłącz polling, gdy karta jest ukryta, jeśli dane nie muszą być aktualne w tle
- dla zdarzeń push użyj WebSocket, SSE albo subskrypcji, a TanStack Query wykorzystaj do aktualizacji cache
- przy WebSocket aktualizuj cache przez `setQueryData` albo invaliduj konkretny key
- nie rób refetchu całego dashboardu co sekundę, jeśli zmienia się tylko jeden licznik
- dla statusu długiego joba rozważ polling z backoffem albo zatrzymaniem po statusie końcowym

Przykład zatrzymania pollingu po zakończeniu joba:

```ts
const jobQuery = createQuery(() => ({
  queryKey: ['jobs', jobId],
  queryFn: ({ signal }) => getJob(jobId, { signal }),
  enabled: Boolean(jobId),
  refetchInterval: (query) => {
    const status = query.state.data?.status
    return status === 'finished' || status === 'failed' ? false : 2_000
  },
}))
```
## Cache a auth, logout i tenant

Cache TanStack Query żyje po stronie przeglądarki. Dane mogą pozostać w pamięci po zmianie routingu, logout albo zmianie tenanta, jeśli nie zostaną usunięte.

Zasady:

- po logout wyczyść cache użytkownika
- po zmianie tenanta wyczyść cache albo uwzględnij `tenantId` w query keys
- nie trzymaj danych jednego użytkownika pod query key niezależnym od użytkownika, jeśli aplikacja pozwala szybko przełączać konta
- nie persistuj cache z danymi prywatnymi bez szyfrowania i jasnego uzasadnienia
- nie wkładaj tokenów auth do query keys ani query data
- po utracie sesji invaliduj albo usuń dane zależne od auth

Przykład logout:

```ts
const logoutMutation = createMutation(() => ({
  mutationKey: ['auth', 'logout'],
  mutationFn: logout,
  onSuccess: async (_data, _variables, _context, context) => {
    context.client.clear()
  },
}))
```

Jeśli nie chcesz czyścić całego cache:

```ts
await queryClient.removeQueries({
  predicate: (query) => query.queryKey[0] !== 'public',
})
```
## Obsługa błędów

Błędy powinny być typowane i mapowane na komunikaty dla użytkownika.

```ts
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Sesja wygasła.'
    if (error.status === 403) return 'Brak uprawnień do tej operacji.'
    if (error.status === 404) return 'Nie znaleziono danych.'
    if (error.status >= 500) return 'Wystąpił błąd serwera.'
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return 'Request został anulowany.'
  }

  return 'Nie udało się wykonać operacji.'
}
```

Zasady:

- rozróżniaj błędy 401, 403, 404, 409, 422, 429 i 5xx
- nie retryuj błędów walidacji i braku uprawnień
- dla 401 uruchom flow odświeżenia sesji albo logout
- dla 409 pokaż konflikt danych albo wymuś refetch
- dla 422 mapuj błędy walidacji na formularz
- dla 429 pokaż komunikat o limicie i nie spamuj retry
- nie pokazuj stack trace użytkownikowi
- loguj błąd raz, na granicy operacji albo w globalnym error handlerze
