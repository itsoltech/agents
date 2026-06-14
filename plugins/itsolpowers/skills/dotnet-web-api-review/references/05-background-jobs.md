# dotnet-web-api-review Reference Sector: Background jobs

## Zawartość

- Background jobs
- Cache
- Rate limiting i abuse protection
- Health checks
- Observability
- QA i scenariusze edge case
- Bezpieczeństwo code review
- Analizatory, warningi i jakość kodu
- CI

## Background jobs

Zasady:

- nie uruchamiaj długich operacji w request thread, jeśli klient nie musi czekać
- używaj `BackgroundService`, kolejki albo zewnętrznego workera
- job powinien mieć ID, status, liczbę prób, timestamps i ostatni błąd
- job powinien być idempotentny
- retry powinien mieć limit i backoff
- nie używaj nieskończonej kolejki w pamięci dla danych produkcyjnych
- przy wielu instancjach zabezpiecz joby przed podwójnym wykonaniem
- używaj distributed lock, lease, kolejki albo DB locking
- graceful shutdown musi kończyć albo bezpiecznie przerywać joby
- job powinien przyjmować `CancellationToken`
- osobne typy jobów powinny mieć osobne limity concurrency
- nie trzymaj `DbContext` między iteracjami joba
- nie wykonuj migracji i długich jobów w tym samym procesie bez kontroli lifecycle'u
## Cache

Zasady:

- cache musi mieć właściciela, TTL i strategię invalidacji
- nie cache'uj danych zależnych od użytkownika bez uwzględnienia user/tenant key
- nie cache'uj błędów autoryzacji globalnie
- local memory cache działa per instancja
- distributed cache jest potrzebny przy wielu instancjach, jeśli cache ma być współdzielony
- cache nie może być jedynym źródłem prawdy
- invalidacja powinna wynikać ze zdarzeń zapisu albo jasnego TTL
- cache stampede ograniczaj przez lock, single-flight albo jitter TTL
- nie cache'uj danych wrażliwych bez analizy
- metryki cache hit/miss powinny być widoczne
- klucz cache powinien zawierać wersję schematu, jeśli format wartości może się zmienić
- po zmianie uprawnień użytkownika cache autoryzacji musi zostać wyczyszczony albo mieć krótki TTL
## Rate limiting i abuse protection

Zasady:

- rate limiting projektuj per endpoint, user, tenant, IP albo API key
- globalny limit nie zastępuje limitów endpointów kosztownych
- endpointy login, password reset, OTP, import, search, export wymagają osobnych limitów
- testuj rate limiting przed produkcją
- definiuj odpowiedź `429` i `Retry-After`, jeśli ma sens
- nie polegaj wyłącznie na IP za proxy; poprawnie konfiguruj forwarded headers
- rozróżniaj authenticated i anonymous traffic
- limity muszą pasować do load balancingu i wielu instancji
- local in-memory limiter nie jest globalnym limitem w klastrze
- retry klientów może spotęgować problem, jeśli limity są źle dobrane

ASP.NET Core ma middleware rate limiting, w którym aplikacja konfiguruje polityki i przypina je do endpointów. Microsoft zaleca testowanie i review endpointów z rate limiting przed wdrożeniem[^rate-limit].
## Health checks

Zasady:

- rozdziel liveness i readiness
- liveness nie powinien zależeć od bazy, jeśli orchestrator zabije zdrowy proces podczas awarii DB
- readiness może sprawdzać zależności wymagane do obsługi ruchu
- health check DB powinien być lekki
- health check nie powinien wykonywać migracji ani ciężkich query
- endpoint health nie powinien ujawniać sekretów i szczegółów infrastruktury publicznie
- osobno monitoruj dependency health, queue depth, pool usage, latency i error rate
- readiness powinien zwrócić failure podczas graceful shutdown, zanim proces zostanie ubity
- health checki powinny mieć timeouty

ASP.NET Core ma wbudowane health checks, które mogą być używane przez monitoring i orchestrator. Dokumentacja pokazuje między innymi probe bazy przez lekkie zapytanie typu `SELECT 1`[^healthchecks].
## Observability

- [ ] logi mają kontekst
- [ ] metryki/tracing, jeśli dotyczy
- [ ] health/readiness bez regresji
## QA i scenariusze edge case

Podczas projektowania testów pytaj:

- co się stanie, gdy użytkownik poda ID zasobu innego tenanta?
- co się stanie, gdy użytkownik ma poprawną rolę, ale nie ma dostępu do tego konkretnego zasobu?
- co się stanie, gdy request zostanie wysłany dwa razy?
- co się stanie, gdy klient zerwie połączenie?
- co się stanie, gdy cancellation dotrze w połowie operacji?
- co się stanie, gdy zewnętrzne API zwróci timeout?
- co się stanie, gdy zewnętrzne API zwróci `429`?
- co się stanie, gdy baza zapisze dane, ale event/webhook się nie wyśle?
- co się stanie, gdy retry wykona operację drugi raz?
- co się stanie, gdy migracja uruchomi się na dwóch instancjach?
- co się stanie, gdy response zawiera enum nieznany frontendowi?
- co się stanie, gdy lista ma 0, 1, 100, 10 000 i 1 000 000 rekordów?
- co się stanie, gdy pole string ma maksymalną długość?
- co się stanie, gdy request body jest większy od limitu?
- co się stanie, gdy JSON ma nieznane pola?
- co się stanie, gdy data jest w innej strefie czasowej?
- co się stanie, gdy zegar systemowy przesunie się?
- co się stanie, gdy dwie osoby edytują ten sam zasób?
- co się stanie, gdy usunięty zasób nadal jest w cache?
- co się stanie, gdy token wygasa w trakcie requestu?
- co się stanie, gdy użytkownik straci uprawnienia, ale ma aktywną sesję?
- co się stanie, gdy payload zawiera HTML/script?
- co się stanie, gdy query string zawiera bardzo długie wartości?
- co się stanie, gdy upload ma złą nazwę pliku, MIME type albo rozszerzenie?
- co się stanie, gdy endpoint jest wywoływany równolegle 100 razy?
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
