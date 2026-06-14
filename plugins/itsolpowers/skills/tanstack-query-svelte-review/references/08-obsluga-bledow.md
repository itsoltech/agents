# tanstack-query-svelte-review Reference Sector: Obsługa błędów

## Zawartość

- Obsługa błędów
- Formularze i mutacje
- URL params, search params i filtry
- Typowanie TypeScript
- Performance
- Persist cache i offline

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
## Formularze i mutacje

Formularz powinien mieć lokalny stan aż do momentu submitu. TanStack Query powinien obsługiwać mutację i synchronizację cache po zapisie.

Zasady:

- nie trzymaj roboczego formularza w query cache
- waliduj formularz lokalnie przed mutacją
- podczas `mutation.isPending` blokuj submit albo zabezpiecz double submit
- błędy 422 mapuj na pola formularza
- po sukcesie zdecyduj: reset formularza, nawigacja, toast, update cache
- nie rób optimistic update dla formularza, którego backend może istotnie przekształcić
- w formularzach edycji możesz użyć query do pobrania danych początkowych, a lokalnego stanu do edycji
- nie binduj bezpośrednio inputów do `query.data`, bo mutujesz dane cache

Przykład kopiowania danych początkowych do formularza:

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { getUser } from '$lib/api/users'

  let { userId }: { userId: string } = $props()

  const userQuery = createQuery(() => ({
    queryKey: ['users', 'detail', userId],
    queryFn: ({ signal }) => getUser(userId, { signal }),
  }))

  let form = $state({
    name: '',
    email: '',
  })

  $effect(() => {
    if (!userQuery.data) return

    form.name = userQuery.data.name
    form.email = userQuery.data.email
  })
</script>
```

Uważaj, aby nie nadpisać lokalnych zmian użytkownika przy background refetchu. Przy formularzach edycji często lepiej inicjalizować stan raz po wejściu na stronę albo kontrolować dirty state.
## URL params, search params i filtry

Dane zależne od URL powinny mieć query key zależny od znormalizowanych parametrów.

Zasady:

- normalizuj puste stringi do `undefined`
- parsuj liczby i booleany przed zbudowaniem query key
- sortuj tablice filtrów, jeśli kolejność nie zmienia wyniku
- trzymaj domyślne wartości w jednym miejscu
- nie wkładaj całego `URLSearchParams` do query key
- nie twórz nowego obiektu filtrów o innym kształcie przy każdym renderze, jeśli nie ma takiej potrzeby
- przy wpisywaniu w search input użyj debounce, a nie requestu na każdy znak

Przykład:

```ts
export const parseUsersFilters = (url: URL) => {
  const page = Number(url.searchParams.get('page') ?? 1)
  const search = url.searchParams.get('search')?.trim() || undefined
  const roles = url.searchParams.getAll('role').sort()

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    search,
    roles,
  }
}
```
## Typowanie TypeScript

Zasady:

- typuj odpowiedź API przy funkcji fetchującej dane
- pozwól TanStack Query wywnioskować typy z `queryFn`, jeśli działa poprawnie
- nie rzutuj `query.data as SomeType`, jeśli typ można wyprowadzić z API clienta
- błędy runtime waliduj przez Zod, Valibot albo inny validator, jeśli API nie jest w pełni zaufane
- query options factory pomaga zachować inferencję typów przy współdzieleniu konfiguracji
- nie używaj `any` w fetcherach i mutation functions
- dla błędów używaj własnej klasy `ApiError` albo typu domenowego
- nie zakładaj, że `error` ma zawsze konkretny typ, jeśli globalnie tego nie skonfigurowano

Przykład:

```ts
export type UpdateUserInput = {
  id: string
  patch: {
    name?: string
    email?: string
  }
}

export type User = {
  id: string
  name: string
  email: string
}

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  return apiFetch<User>(`/users/${encodeURIComponent(input.id)}`, {
    method: 'PATCH',
    body: input.patch,
  })
}
```
## Performance

TanStack Query ogranicza duplikację requestów i ułatwia cache, ale zła konfiguracja może generować zbędny ruch i duży cache.

Zasady:

- ustaw `staleTime` dla danych, które nie muszą być odświeżane przy każdym wejściu na stronę
- nie ustawiaj wszędzie `staleTime: Infinity`, jeśli dane mogą zmienić się poza aplikacją
- ustaw krótszy `gcTime` dla ciężkich danych i długich list
- unikaj `refetchOnWindowFocus: true` dla kosztownych endpointów, jeśli UX tego nie wymaga
- nie renderuj ogromnych list bez wirtualizacji
- nie trzymaj pełnych payloadów, jeśli komponent potrzebuje tylko kilku pól
- używaj `select`, jeśli redukuje koszt renderowania
- unikaj masowego `invalidateQueries()` bez filtrów
- nie rób prefetchu wszystkiego na wejściu do aplikacji
- prefetchuj tylko dane z dużym prawdopodobieństwem użycia
- przy wyszukiwarkach używaj debounce i minimalnej długości frazy
- przy uploadach i dużych plikach używaj osobnego mechanizmu postępu, a nie oczekuj, że query cache rozwiąże cały problem
## Persist cache i offline

Persist cache może poprawić UX, ale zwiększa ryzyko przechowywania danych prywatnych po stronie klienta.

Zasady:

- persistuj tylko queries, które mogą bezpiecznie zostać zapisane w przeglądarce
- nie persistuj danych wrażliwych bez zgody architektury bezpieczeństwa
- dodaj wersjonowanie persistera, żeby można było wyczyścić stary format cache
- ustaw `maxAge`
- przy logout czyść persisted cache
- przy zmianie użytkownika albo tenanta czyść persisted cache albo użyj osobnego namespace
- nie persistuj błędów i mutacji bez jasnego celu
- przy trybie offline rozróżniaj dane stare od aktualnych
