# effect-typescript-implementation Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `effect-typescript-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Effect TypeScript implementation

## Przeniesione sekcje

- Cel dokumentu
- Założenia techniczne
- Instalacja i konfiguracja
- Importy i styl modułów
- Mental model Effect
- Granice uruchamiania Effect
- Tworzenie efektów
- Effect.gen i pipe
- Error model
- Cause, Exit i diagnostyka błędów
- API client i fetch
- Schema i walidacja runtime
- Typy domenowe, Data i branded types
- Pattern matching
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

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (167 linii) - Overview; Cel dokumentu; Założenia techniczne; Instalacja i konfiguracja; +4 więcej
- `02-effect-gen-i-pipe.md` (172 linii) - Effect.gen i pipe; Error model; Cause, Exit i diagnostyka błędów; API client i fetch
- `03-schema-i-walidacja-runtime.md` (173 linii) - Schema i walidacja runtime; Typy domenowe, Data i branded types; Pattern matching; Services, Context i Layer; +1 więcej
- `04-konfiguracja-i-sekrety.md` (180 linii) - Konfiguracja i sekrety; Resource management i Scope; Retry, timeouty i Schedule; Concurrency; +5 więcej
- `05-observability.md` (163 linii) - Observability; Bezpieczeństwo; Frontend i Svelte/SvelteKit; Backend, CLI i workery; +2 więcej
- `06-organizacja-projektu.md` (170 linii) - Organizacja projektu; Czytelność i styl; Integracja z bibliotekami Promise; Integracja z bazą danych; +2 więcej
