# tanstack-query-svelte-implementation Reference Sector: Devtools

## Zawartość

- Devtools
- ESLint plugin query
- Testy
- CI
- Migracja z v4 do v5
- Struktura katalogów

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
## ESLint plugin query

W projektach z dużym użyciem TanStack Query warto włączyć `@tanstack/eslint-plugin-query`.

Reguły, które warto rozważyć:

- stable query client
- exhaustive deps
- no rest destructuring
- no unstable deps
- infinite query property order
- no void query functions
- mutation property order
- prefer query options

Zasady:

- traktuj linter jako ochronę przed niestabilnymi query keys i złymi zależnościami
- nie wyłączaj reguł globalnie bez powodu
- jeśli reguła nie pasuje do konkretnego przypadku, dodaj lokalne wyjaśnienie
- konfiguracja ESLint powinna być częścią CI
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
## Struktura katalogów

Przykład struktury dla większego projektu:

```txt
src/lib/api/
  api-error.ts
  api-fetch.ts
  users.ts
  projects.ts

src/lib/queries/
  users.keys.ts
  users.queries.ts
  users.mutations.ts
  projects.keys.ts
  projects.queries.ts
  projects.mutations.ts

src/lib/components/
  users/
    UsersTable.svelte
    UserForm.svelte
    UserDetails.svelte

src/routes/
  users/
    +page.ts
    +page.svelte
  users/[id]/
    +page.ts
    +page.svelte
```

Zasady:

- fetchery trzymaj w `api/`
- query keys i query options trzymaj w `queries/`
- komponenty nie powinny budować URL-i API ręcznie
- komponenty mogą używać `createQuery`, ale nie powinny znać szczegółów endpointów
- mutacje trzymaj blisko domeny, nie w globalnym pliku `mutations.ts`
- unikaj katalogów `utils` jako miejsca na wszystko
