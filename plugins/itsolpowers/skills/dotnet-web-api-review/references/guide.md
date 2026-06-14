# dotnet-web-api-review Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `dotnet-aspnet-core-web-api-best-practices.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

ASP.NET Core Web API review

## Przeniesione sekcje

- Główna zasada
- Dobór architektury do rozmiaru aplikacji
- Vertical slice
- Modularny monolit
- Clean architecture
- DDD
- CQRS
- MediatR i pipeline handlers
- Minimal APIs czy kontrolery
- Program.cs i składanie aplikacji
- Middleware
- Dependency injection
- Konfiguracja i options pattern
- DTO, kontrakty i mapowanie
- Walidacja danych wejściowych
- Obsługa błędów i ProblemDetails
- API design
- OpenAPI
- Autoryzacja i uwierzytelnianie
- CORS, CSRF i przeglądarka
- Sekrety i dane wrażliwe
- Data Protection i wiele instancji
- Komunikacja HTTP z innymi usługami
- EF Core i dostęp do danych
- Transakcje i spójność
- Background jobs
- Cache
- Rate limiting i abuse protection
- Health checks
- Observability
- QA i scenariusze edge case
- Bezpieczeństwo code review
- Analizatory, warningi i jakość kodu
- CI
- Deployment i kontenery z perspektywy aplikacji
- Migracje bazy
- Kiedy przemyśleć refactor
- Minimalny standard nowego API
- Checklist code review
- Przykładowy szablon PR
- Zakres
- Typ zmiany
- Architektura
- Security
- Dane
- Testy
- Ryzyka

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (151 linii) - Overview; Główna zasada; Dobór architektury do rozmiaru aplikacji; Vertical slice; +2 więcej
- `02-ddd.md` (144 linii) - DDD; CQRS; MediatR i pipeline handlers; Minimal APIs czy kontrolery
- `03-program-cs-i-skladanie-aplikacji.md` (183 linii) - Program.cs i składanie aplikacji; Middleware; Dependency injection; Konfiguracja i options pattern; +3 więcej
- `04-api-design.md` (188 linii) - API design; OpenAPI; Autoryzacja i uwierzytelnianie; CORS, CSRF i przeglądarka; +5 więcej
- `05-background-jobs.md` (193 linii) - Background jobs; Cache; Rate limiting i abuse protection; Health checks; +5 więcej
- `06-deployment-i-kontenery-z-perspektywy-aplikacji.md` (188 linii) - Deployment i kontenery z perspektywy aplikacji; Migracje bazy; Kiedy przemyśleć refactor; Minimalny standard nowego API; +1 więcej
- `07-przykladowy-szablon-pr.md` (58 linii) - Przykładowy szablon PR
