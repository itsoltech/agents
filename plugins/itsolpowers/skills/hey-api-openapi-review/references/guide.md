# hey-api-openapi-review Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `hey-api-openapi-ts-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Hey API OpenAPI review

## Przeniesione sekcje

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
- Multi API, monorepo i wiele outputów
- Bezpieczeństwo generowanego klienta
- Error handling
- Caching i invalidation
- Wydajność i bundle size
- Review wygenerowanego kodu
- Testy
- CI i kontrola kontraktu
- Migracje kontraktu API
- Checklist do code review
- Minimalny standard projektu

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (191 linii) - Overview; Założenia; Instalacja i wersjonowanie; Struktura katalogów; +3 więcej
- `02-openapi-jako-kontrakt.md` (154 linii) - OpenAPI jako kontrakt; Jakość schematów danych; Parser, patch, filters i transforms; Plugin TypeScript; +1 więcej
- `03-klient-fetch.md` (183 linii) - Klient Fetch; Auth i sesja; Komunikacja z API; Runtime validation i Zod; +1 więcej
- `04-svelte-i-sveltekit.md` (179 linii) - Svelte i SvelteKit; Multi API, monorepo i wiele outputów; Bezpieczeństwo generowanego klienta; Error handling; +4 więcej
- `05-ci-i-kontrola-kontraktu.md` (171 linii) - CI i kontrola kontraktu; Migracje kontraktu API; Checklist do code review; Minimalny standard projektu
