# tanstack-query-svelte-debugging Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `tanstack-query-svelte-v5-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

TanStack Query Svelte debugging

## Przeniesione sekcje

- Konfiguracja dla SvelteKit SSR
- Prefetch w SvelteKit przez `initialData`
- Prefetch w SvelteKit przez `prefetchQuery`
- Domyślne zachowania v5
- Query keys
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
- Obsługa błędów
- URL params, search params i filtry
- Performance
- Persist cache i offline
- Devtools
- Testy
- CI
- Migracja z v4 do v5

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (184 linii) - Overview; Konfiguracja dla SvelteKit SSR; Prefetch w SvelteKit przez `initialData`; Prefetch w SvelteKit przez `prefetchQuery`
- `02-domyslne-zachowania-v5.md` (161 linii) - Domyślne zachowania v5; Query keys; `createQuery`
- `03-reaktywnosc-w-svelte.md` (113 linii) - Reaktywność w Svelte; Statusy query w v5; `enabled` i queries zależne
- `04-api-client-i-fetch.md` (169 linii) - API client i `fetch`; Cancellation; Transformacja danych przez `select`
- `05-mutacje.md` (189 linii) - Mutacje; Statusy mutacji w v5; Invalidacje po mutacjach; Aktualizacja cache przez `setQueryData`; +1 więcej
- `06-paginacja.md` (175 linii) - Paginacja; Infinite queries; Polling, refetch i realtime; Cache a auth, logout i tenant; +1 więcej
- `07-url-params-search-params-i-filtry.md` (163 linii) - URL params, search params i filtry; Performance; Persist cache i offline; Devtools; +3 więcej
