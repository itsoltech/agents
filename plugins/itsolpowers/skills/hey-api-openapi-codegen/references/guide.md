# hey-api-openapi-codegen Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `hey-api-openapi-ts-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Hey API OpenAPI codegen

## Przeniesione sekcje

- Cel dokumentu
- Założenia
- Instalacja i wersjonowanie
- Struktura katalogów
- Podstawowa konfiguracja
- Input specyfikacji
- Output i wygenerowane pliki
- OpenAPI jako kontrakt
- Jakość schematów danych
- Parser, patch, filters i transforms
- Plugin TypeScript
- Plugin SDK
- Klient Fetch
- Auth i sesja
- Komunikacja z API
- Runtime validation i Zod
- TanStack Query plugin
- Svelte i SvelteKit
- Vite plugin
- Multi API, monorepo i wiele outputów
- Bezpieczeństwo generowanego klienta
- Error handling
- Formularze i walidacja danych wejściowych
- Caching i invalidation
- Wydajność i bundle size
- Testy
- CI i kontrola kontraktu
- Migracje kontraktu API
- Publikacja wygenerowanego klienta jako paczki
- Przykład konfiguracji produkcyjnej dla SvelteKit + TanStack Query + Zod
- Minimalny standard projektu

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (164 linii) - Overview; Cel dokumentu; Założenia; Instalacja i wersjonowanie; +3 więcej
- `02-output-i-wygenerowane-pliki.md` (187 linii) - Output i wygenerowane pliki; OpenAPI jako kontrakt; Jakość schematów danych; Parser, patch, filters i transforms; +2 więcej
- `03-klient-fetch.md` (183 linii) - Klient Fetch; Auth i sesja; Komunikacja z API; Runtime validation i Zod; +1 więcej
- `04-svelte-i-sveltekit.md` (181 linii) - Svelte i SvelteKit; Vite plugin; Multi API, monorepo i wiele outputów; Bezpieczeństwo generowanego klienta; +4 więcej
- `05-testy.md` (160 linii) - Testy; CI i kontrola kontraktu; Migracje kontraktu API; Publikacja wygenerowanego klienta jako paczki; +2 więcej
