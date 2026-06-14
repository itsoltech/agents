# tanstack-query-svelte-review Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `tanstack-query-svelte-v5-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

TanStack Query Svelte review

## Przeniesione sekcje

- Kiedy używać TanStack Query
- Minimalna konfiguracja klienta
- Konfiguracja dla SvelteKit SSR
- Prefetch w SvelteKit przez `initialData`
- Prefetch w SvelteKit przez `prefetchQuery`
- Domyślne zachowania v5
- Query keys
- Query options factory
- `createQuery`
- Reaktywność w Svelte
- Statusy query w v5
- `enabled` i queries zależne
- API client i `fetch`
- Cancellation
- Transformacja danych przez `select`
- Mutacje
- Statusy mutacji w v5
- Invalidacje po mutacjach
- Aktualizacja cache przez `setQueryData`
- Optimistic updates
- Paginacja
- Infinite queries
- Polling, refetch i realtime
- Cache a auth, logout i tenant
- Bezpieczeństwo
- Obsługa błędów
- Formularze i mutacje
- URL params, search params i filtry
- Typowanie TypeScript
- Performance
- Persist cache i offline
- Devtools
- ESLint plugin query
- Testy
- CI
- Migracja z v4 do v5
- Checklist do code review

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (167 linii) - Overview; Kiedy używać TanStack Query; Minimalna konfiguracja klienta; Konfiguracja dla SvelteKit SSR; +1 więcej
- `02-prefetch-w-sveltekit-przez-prefetchquery.md` (135 linii) - Prefetch w SvelteKit przez `prefetchQuery`; Domyślne zachowania v5
- `03-query-keys.md` (158 linii) - Query keys; Query options factory; `createQuery`
- `04-reaktywnosc-w-svelte.md` (113 linii) - Reaktywność w Svelte; Statusy query w v5; `enabled` i queries zależne
- `05-api-client-i-fetch.md` (169 linii) - API client i `fetch`; Cancellation; Transformacja danych przez `select`
- `06-mutacje.md` (189 linii) - Mutacje; Statusy mutacji w v5; Invalidacje po mutacjach; Aktualizacja cache przez `setQueryData`; +1 więcej
- `07-paginacja.md` (165 linii) - Paginacja; Infinite queries; Polling, refetch i realtime; Cache a auth, logout i tenant; +1 więcej
- `08-obsluga-bledow.md` (184 linii) - Obsługa błędów; Formularze i mutacje; URL params, search params i filtry; Typowanie TypeScript; +2 więcej
- `09-devtools.md` (121 linii) - Devtools; ESLint plugin query; Testy; CI; +1 więcej
- `10-checklist-do-code-review.md` (96 linii) - Checklist do code review
