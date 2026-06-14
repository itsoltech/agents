# svelte-implementation Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `svelte-frontend-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Svelte/SvelteKit implementation

## Przeniesione sekcje

- Cel dokumentu
- Założenia techniczne
- Zasady ogólne
- TypeScript
- Struktura projektu
- Pliki Svelte i długość komponentów
- Svelte 5 reactivity
- Props, events, bind i snippets
- State management
- SvelteKit routing i rendering
- `load` i pobieranie danych
- Komunikacja z API
- Runtime config i zmienne środowiskowe
- Autoryzacja i sesja
- Formularze, Superforms i Zod
- Dostępność
- Performance UI i rendering
- Bundle size i zależności frontendowe
- Obrazy, fonty i assets
- CSS i design system
- UX stanów asynchronicznych
- Error handling w SvelteKit
- Realtime, WebSocket i SSE
- Internationalizacja i formatowanie danych
- Testy jednostkowe i komponentowe
- Testy E2E
- Dostępność w testach
- Observability i diagnostyka
- CI, lint i formatowanie
- Review zależności
- Deployment i hosting
- SPA z osobnym API
- SSR/SvelteKit server mode

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (189 linii) - Overview; Cel dokumentu; Założenia techniczne; Zasady ogólne; +7 więcej
- `02-load-i-pobieranie-danych.md` (184 linii) - `load` i pobieranie danych; Komunikacja z API; Runtime config i zmienne środowiskowe; Autoryzacja i sesja; +1 więcej
- `03-dostepnosc.md` (186 linii) - Dostępność; Performance UI i rendering; Bundle size i zależności frontendowe; Obrazy, fonty i assets; +9 więcej
- `04-ci-lint-i-formatowanie.md` (100 linii) - CI, lint i formatowanie; Review zależności; Deployment i hosting; SPA z osobnym API; +1 więcej
