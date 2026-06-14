# dotnet-web-api-implementation Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `dotnet-aspnet-core-web-api-best-practices.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

ASP.NET Core Web API implementation

## Przeniesione sekcje

- Cel dokumentu
- Główna zasada
- Dobór architektury do rozmiaru aplikacji
- MVP i szybka iteracja
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
- Testowalny kod
- Rodzaje testów
- Bezpieczeństwo code review
- Analizatory, warningi i jakość kodu
- CI
- Deployment i kontenery z perspektywy aplikacji
- Migracje bazy
- Upgrade do nowszej wersji .NET
- Minimalny standard nowego API

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (176 linii) - Overview; Cel dokumentu; Główna zasada; Dobór architektury do rozmiaru aplikacji; +3 więcej
- `02-clean-architecture.md` (188 linii) - Clean architecture; DDD; CQRS; MediatR i pipeline handlers; +1 więcej
- `03-program-cs-i-skladanie-aplikacji.md` (183 linii) - Program.cs i składanie aplikacji; Middleware; Dependency injection; Konfiguracja i options pattern; +3 więcej
- `04-api-design.md` (188 linii) - API design; OpenAPI; Autoryzacja i uwierzytelnianie; CORS, CSRF i przeglądarka; +5 więcej
- `05-background-jobs.md` (173 linii) - Background jobs; Cache; Rate limiting i abuse protection; Health checks; +3 więcej
- `06-bezpieczenstwo-code-review.md` (190 linii) - Bezpieczeństwo code review; Analizatory, warningi i jakość kodu; CI; Deployment i kontenery z perspektywy aplikacji; +3 więcej
