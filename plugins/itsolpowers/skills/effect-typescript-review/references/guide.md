# effect-typescript-review Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `effect-typescript-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Effect TypeScript review

## Przeniesione sekcje

- Mental model Effect
- Granice uruchamiania Effect
- Error model
- Cause, Exit i diagnostyka błędów
- API client i fetch
- Schema i walidacja runtime
- Typy domenowe, Data i branded types
- Services, Context i Layer
- Layer composition
- Konfiguracja i sekrety
- Resource management i Scope
- Retry, timeouty i Schedule
- Concurrency
- Fibers i lifecycle
- Queue, PubSub i backpressure
- Cache i batching
- Stream i Sink
- Observability
- Bezpieczeństwo
- Frontend i Svelte/SvelteKit
- Backend, CLI i workery
- Testowanie
- Wydajność
- Organizacja projektu
- Czytelność i styl
- Integracja z bibliotekami Promise
- Integracja z bazą danych
- Antywzorce
- Minimalny zestaw kontroli w CI
- Checklist skrócony do code review

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (134 linii) - Overview; Mental model Effect; Granice uruchamiania Effect; Error model; +1 więcej
- `02-api-client-i-fetch.md` (137 linii) - API client i fetch; Schema i walidacja runtime; Typy domenowe, Data i branded types
- `03-services-context-i-layer.md` (189 linii) - Services, Context i Layer; Layer composition; Konfiguracja i sekrety; Resource management i Scope; +1 więcej
- `04-concurrency.md` (186 linii) - Concurrency; Fibers i lifecycle; Queue, PubSub i backpressure; Cache i batching; +5 więcej
- `05-testowanie.md` (177 linii) - Testowanie; Wydajność; Organizacja projektu; Czytelność i styl; +3 więcej
- `06-minimalny-zestaw-kontroli-w-ci.md` (133 linii) - Minimalny zestaw kontroli w CI; Checklist skrócony do code review
