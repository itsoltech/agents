# effect-typescript-debugging Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `effect-typescript-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Effect TypeScript debugging

## Przeniesione sekcje

- Granice uruchamiania Effect
- Error model
- Cause, Exit i diagnostyka błędów
- API client i fetch
- Schema i walidacja runtime
- Services, Context i Layer
- Layer composition
- Konfiguracja i sekrety
- Resource management i Scope
- Retry, timeouty i Schedule
- Concurrency
- Fibers i lifecycle
- Queue, PubSub i backpressure
- Ref, SynchronizedRef i stan
- Cache i batching
- Stream i Sink
- Observability
- Frontend i Svelte/SvelteKit
- Backend, CLI i workery
- Testowanie
- Wydajność
- Integracja z bibliotekami Promise
- Integracja z bazą danych
- Antywzorce

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (190 linii) - Overview; Granice uruchamiania Effect; Error model; Cause, Exit i diagnostyka błędów; +1 więcej
- `02-schema-i-walidacja-runtime.md` (166 linii) - Schema i walidacja runtime; Services, Context i Layer; Layer composition; Konfiguracja i sekrety
- `03-resource-management-i-scope.md` (181 linii) - Resource management i Scope; Retry, timeouty i Schedule; Concurrency; Fibers i lifecycle; +5 więcej
- `04-frontend-i-svelte-sveltekit.md` (166 linii) - Frontend i Svelte/SvelteKit; Backend, CLI i workery; Testowanie; Wydajność; +3 więcej
