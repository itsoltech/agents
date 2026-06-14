# dotnet-web-api-implementation Reference Sector: Bezpieczeństwo code review

## Zawartość

- Bezpieczeństwo code review
- Analizatory, warningi i jakość kodu
- CI
- Deployment i kontenery z perspektywy aplikacji
- Migracje bazy
- Upgrade do nowszej wersji .NET
- Minimalny standard nowego API

## Bezpieczeństwo code review

Reviewer powinien sprawdzić:

- czy każdy endpoint wymaga auth, jeśli nie jest publiczny
- czy endpoint po ID sprawdza authorization per zasób
- czy tenant isolation jest egzekwowane w query i command
- czy request DTO nie pozwala ustawić pól systemowych
- czy walidacja obejmuje route/query/body
- czy dane wejściowe nie są interpolowane do SQL
- czy upload ma limity i walidację
- czy CORS jest zawężony
- czy cookie auth ma CSRF
- czy JWT waliduje issuer/audience/lifetime
- czy błędy nie ujawniają stack trace
- czy logi nie zawierają sekretów
- czy OpenAPI nie wystawia endpointów administracyjnych bez potrzeby
- czy rate limiting chroni kosztowne endpointy
- czy sekrety nie są w repo
- czy `AllowAnonymous` ma uzasadnienie
- czy `RequireAuthorization` jest na grupie endpointów albo endpointach
- czy nie ma `TODO: secure later`
## Analizatory, warningi i jakość kodu

Zasady:

- włącz nullable reference types
- traktuj warningi jako błędy w CI
- używaj .NET analyzers
- włącz security analyzers
- nie wyciszaj reguł globalnie bez uzasadnienia
- każdy `#pragma warning disable` wymaga komentarza
- używaj `.editorconfig` do spójnych reguł
- sprawdzaj formatowanie przez `dotnet format`
- audytuj pakiety NuGet
- nie dodawaj pakietu dla jednej prostej funkcji
- usuwaj nieużywane zależności

Przykładowe ustawienia:

```xml
<PropertyGroup>
  <TargetFramework>net10.0</TargetFramework>
  <Nullable>enable</Nullable>
  <ImplicitUsings>enable</ImplicitUsings>
  <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  <AnalysisLevel>latest</AnalysisLevel>
  <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
  <NuGetAudit>true</NuGetAudit>
</PropertyGroup>
```

.NET analyzers sprawdzają jakość, bezpieczeństwo, wydajność i design. Dla projektów targetujących .NET 5+ analiza jest domyślnie włączona, a NuGet ma mechanizmy audytu podatności pakietów[^analyzers][^nuget-audit].
## CI

Minimalny zestaw:

```bash
dotnet restore
dotnet build --configuration Release --no-restore
dotnet test --configuration Release --no-build
dotnet format --verify-no-changes
dotnet list package --vulnerable --include-transitive
```

Dodatkowe bramki:

- testy integracyjne z bazą
- testy migracji
- OpenAPI generation + diff
- SAST
- dependency scanning
- secret scanning
- container image scanning
- testy wydajnościowe dla hot endpointów
- testy kontraktowe dla publicznego API
- architekturalne testy zależności między projektami
- coverage dla domeny i application layer
- smoke test po deployment

Dla .NET 10 `dotnet restore` audytuje też pakiety transitive domyślnie dla projektów targetujących .NET 10 lub nowszy[^nuget-transitive].
## Deployment i kontenery z perspektywy aplikacji

Zasady:

- aplikacja powinna startować deterministycznie i szybko
- konfiguracja musi być walidowana przy starcie
- aplikacja nie powinna wymagać ręcznego kroku po starcie
- migracje DB uruchamiaj kontrolowanie, nie przypadkowo na każdej instancji
- kontener nie powinien działać jako root, jeśli nie ma takiej potrzeby
- nie zapisuj trwałych danych w filesystemie kontenera
- loguj na stdout/stderr w formacie obsługiwanym przez platformę
- używaj readiness do dopuszczenia ruchu
- używaj liveness do wykrycia martwego procesu
- obsługuj SIGTERM i graceful shutdown
- health checks i metryki nie mogą wymagać pełnej autoryzacji użytkownika, ale nie powinny publicznie ujawniać szczegółów
- obrazy buduj jako multi-stage albo przez `dotnet publish` container support
- pinuj bazowe obrazy runtime
- skanuj obrazy

Microsoft udostępnia oficjalne obrazy .NET zoptymalizowane pod różne scenariusze oraz dokumentuje budowanie obrazów ASP.NET Core przez multi-stage Dockerfile i `dotnet publish`[^docker-images][^docker-aspnet][^docker-publish].
## Migracje bazy

Zasady:

- migracje są częścią release'u
- każda migracja powinna być możliwa do uruchomienia na danych produkcyjnych
- migracje długotrwałe dziel na kroki
- najpierw dodaj kompatybilny schemat, potem deploy aplikacji, potem usuń stare pola
- unikaj destructive migration bez backupu i planu rollback
- nie zakładaj, że rollback aplikacji cofnie migrację danych
- migracje powinny być idempotentne albo kontrolowane przez narzędzie migracyjne
- seed danych produkcyjnych powinien być osobny od seed danych developerskich
- testuj migrację na kopii produkcyjnych danych
- przy wielu instancjach nie uruchamiaj migracji równolegle bez locka
- indeksy na dużych tabelach twórz w sposób nieblokujący, jeśli baza to wspiera
- po migracji obserwuj slow queries, locki i error rate
## Upgrade do nowszej wersji .NET

Zasady:

- śledź daty końca wsparcia target frameworka
- nie czekaj z upgrade do ostatniego miesiąca wsparcia
- najpierw upgrade SDK lokalnie i w CI
- potem zmień target framework
- potem aktualizuj ASP.NET Core, EF Core i biblioteki powiązane
- czytaj breaking changes dla wersji docelowej
- uruchom pełny test suite
- uruchom testy integracyjne z realną bazą
- sprawdź generated OpenAPI diff
- sprawdź performance smoke test
- sprawdź serialization, model binding, validation, auth i middleware
- sprawdź zachowanie logging/metrics/diagnostics
- sprawdź Dockerfile i bazowe obrazy
- sprawdź runtime w środowisku deploymentowym
- dla dużych projektów upgrade rób modułami albo przez branch stabilizacyjny
- utrzymuj `global.json` albo `rust-toolchain` odpowiednik dla .NET: `global.json`, jeśli chcesz pinować SDK
- aktualizuj analyzers i reguły CI razem z target frameworkiem

Microsoft prowadzi strony breaking changes dla każdej wersji .NET oraz dokumentację upgrade'u. Dokumentacja z 2026 wskazuje, że .NET Upgrade Assistant jest zdeprecjonowany na rzecz GitHub Copilot app modernization agent, a Upgrade Assistant można stosować, gdy modernization agent nie jest dostępny[^breaking10][^upgrade][^upgrade-assistant-deprecated].

Przykład `global.json`:

```json
{
  "sdk": {
    "version": "10.0.100",
    "rollForward": "latestFeature"
  }
}
```
## Minimalny standard nowego API

Nowe API powinno mieć:

- .NET 10 LTS
- nullable enabled
- warnings as errors
- analyzers enabled
- typowaną konfigurację z walidacją
- structured logging
- ProblemDetails
- OpenAPI generation
- health checks live/ready
- auth i authorization policies
- rate limiting dla publicznych i kosztownych endpointów
- request size limits
- DTO oddzielone od encji
- testy jednostkowe domeny/aplikacji
- testy integracyjne endpointów
- testy DB/migracji
- CI z restore/build/test/format/audit
- Dockerfile albo `dotnet publish` container support
- graceful shutdown
- cancellation tokens w I/O
- `IHttpClientFactory` dla zależności HTTP
- jawny plan obsługi błędów
- brak sekretów w repo i logach
