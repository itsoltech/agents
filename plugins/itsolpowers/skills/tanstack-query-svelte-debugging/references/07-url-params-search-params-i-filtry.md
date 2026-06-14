# tanstack-query-svelte-debugging Reference Sector: URL params, search params i filtry

## Zawartość

- URL params, search params i filtry
- Performance
- Persist cache i offline
- Devtools
- Testy
- CI
- Migracja z v4 do v5

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
## Devtools

Devtools pomagają diagnozować query keys, cache, retry, statusy i invalidacje.

Zasady:

- devtools instaluj jako zależność developerską
- devtools renderuj tylko w dev mode
- nie włączaj devtools w produkcji bez świadomej decyzji
- przy CSP z nonce przekaż `styleNonce`, jeśli projekt tego wymaga
- używaj devtools do sprawdzania, czy query key zmienia się zgodnie z filtrami
- sprawdzaj w devtools, czy po mutacji invalidowane są właściwe queries
- sprawdzaj, czy query nie refetchują w pętli przez niestabilne parametry
## Testy

Testy komponentów i funkcji z TanStack Query powinny używać świeżego `QueryClient` per test.

```ts
import { QueryClient } from '@tanstack/svelte-query'

export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
```

Zasady:

- twórz nowy `QueryClient` dla każdego testu
- wyłącz retry w testach, żeby błędy były szybkie i deterministyczne
- czyść cache po teście, jeśli klient jest współdzielony
- mockuj API na granicy fetchera albo przez MSW
- testuj stany: loading, success, empty, error, refetching
- testuj invalidację po mutacji
- testuj optimistic update i rollback
- nie testuj wewnętrznych pól TanStack Query, jeśli wystarczy test zachowania UI
- przy testach SvelteKit `load` testuj użycie SvelteKit `fetch`
- nie używaj prawdziwego backendu w testach jednostkowych komponentów
## CI

Minimalny zestaw kontroli:

```bash
pnpm check
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

Dla projektów z testami typów:

```bash
pnpm svelte-check
pnpm vitest run
pnpm playwright test
```

Dla projektów z query-heavy frontendem dodaj testy:

- czy query keys nie gubią filtrów
- czy logout czyści cache
- czy zmiana tenanta nie pokazuje danych poprzedniego tenanta
- czy mutacja invaliduje właściwe queries
- czy błędy 401, 403, 422, 429 i 5xx są poprawnie mapowane
- czy requesty przy search input nie idą na każdy znak bez debounce
## Migracja z v4 do v5

Przy migracji dokumentacji albo kodu z v4 na v5 sprawdź te punkty:

- `cacheTime` zmień na `gcTime`
- `status: 'loading'` zmień na `status: 'pending'`
- `isLoading` w mutacjach zmień na `isPending`
- callbacks `onSuccess`, `onError`, `onSettled` zostały usunięte z queries, ale nadal istnieją w mutacjach
- `query.remove()` zastąp `queryClient.removeQueries({ queryKey })`
- `keepPreviousData: true` zastąp `placeholderData: (previousData) => previousData` albo helperem, jeśli jest dostępny w używanej wersji
- `useErrorBoundary` zmień na `throwOnError`
- `isDataEqual` zastąp `structuralSharing`
- dla infinite queries dodaj `initialPageParam`
- nie przenoś przykładów v4 ze store syntax bez sprawdzenia aktualnego API Svelte
- w Svelte latest używaj `createQuery(() => ({ ... }))`, nie `createQuery({ ... })`
