# dotnet-web-api-review Reference Sector: Program.cs i składanie aplikacji

## Zawartość

- Program.cs i składanie aplikacji
- Middleware
- Dependency injection
- Konfiguracja i options pattern
- DTO, kontrakty i mapowanie
- Walidacja danych wejściowych
- Obsługa błędów i ProblemDetails

## Program.cs i składanie aplikacji

`Program.cs` nie powinien stać się miejscem na całą aplikację.

Zasady:

- `Program.cs` powinien ładować konfigurację, rejestrować usługi, middleware i endpointy
- rejestrację feature'ów przenoś do metod rozszerzających
- unikaj ręcznego `BuildServiceProvider()` podczas rejestracji usług
- nie wykonuj ciężkich operacji sync podczas startu
- waliduj konfigurację przy starcie
- trzymaj kolejność middleware jawnie i komentuj nietypowe decyzje
- nie włączaj Swagger/OpenAPI UI w produkcji bez kontroli dostępu
- nie mapuj `/health` i `/metrics` bez przemyślenia ekspozycji

Przykład:

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddAppOptions(builder.Configuration)
    .AddAppDatabase(builder.Configuration)
    .AddAppAuth(builder.Configuration)
    .AddAppProblemDetails()
    .AddAppOpenApi()
    .AddOrdersModule()
    .AddBillingModule();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapHealthChecks("/health/live");
app.MapHealthChecks("/health/ready");
app.MapOrdersEndpoints();
app.MapBillingEndpoints();

app.Run();

public partial class Program;
```

`public partial class Program` ułatwia testy integracyjne przez `WebApplicationFactory`.
## Middleware

Middleware działa w kolejności rejestracji.

Zasady:

- middleware globalne dodawaj tylko wtedy, gdy dotyczy całej aplikacji
- logowanie requestów nie powinno logować pełnych body domyślnie
- exception handling powinien być zarejestrowany wcześnie
- authentication musi być przed authorization
- CORS musi być ustawiony zgodnie z routingiem i auth
- rate limiting powinien być przetestowany pod realnym ruchem
- response compression włączaj po analizie payloadów i proxy
- request decompression włączaj razem z limitami rozmiaru body
- middleware czytający body musi uważać na buffering i pamięć
- nie wkładaj logiki biznesowej do middleware

ASP.NET Core dokumentuje middleware dla kompresji odpowiedzi, dekompresji requestów, routingu, CORS, auth, rate limiting i innych funkcji, z kolejnością mającą wpływ na działanie aplikacji[^middleware][^compression][^decompression].
## Dependency injection

ASP.NET Core ma wbudowany kontener DI. Używaj go do jawnego przekazywania zależności, nie jako service locator.

Zasady:

- zależności przekazuj przez konstruktor albo parametry endpointu
- unikaj statycznego mutable state
- unikaj `IServiceProvider.GetRequiredService()` w kodzie domenowym
- unikaj bezpośredniego `new` dla zależności infrastrukturalnych
- serwisy powinny być małe, testowalne i dobrze nazwane
- `Singleton` nie może zależeć od `Scoped`
- `Scoped` jest dobrym domyślnym lifetime dla use case services i EF `DbContext`
- `Transient` stosuj dla lekkich, bezstanowych serwisów
- `Singleton` stosuj dla stateless services, cache'y, konfiguracji, klientów thread-safe
- nie przechowuj request-specific data w singletonie
- włącz walidację scope'ów w dev/test
- serwisy implementujące `IDisposable` rejestrowane w DI powinny być tworzone przez DI
- nie rejestruj wszystkiego jako interfejs, jeśli istnieje tylko jedna implementacja i nie potrzebujesz seam do testów

Microsoft zaleca projektowanie usług DI bez globalnego stanu, bez ręcznego tworzenia zależności wewnątrz serwisów i z małymi, testowalnymi klasami[^di-guidelines].
## Konfiguracja i options pattern

Konfiguracja powinna być jawna, typowana i walidowana.

Zasady:

- grupuj konfigurację w klasach options
- używaj `IOptions<T>`, `IOptionsSnapshot<T>`, `IOptionsMonitor<T>` zgodnie z potrzebą
- waliduj options przy starcie przez `ValidateOnStart`
- nie czytaj `IConfiguration` w losowych miejscach kodu
- nie przechowuj sekretów w `appsettings.json`
- dla dev używaj User Secrets, ale nie traktuj ich jako szyfrowanego store'a
- dla produkcji używaj zmiennych środowiskowych, secret managera platformy albo Vault
- konfiguracja powinna mieć bezpieczne defaulty albo wymuszać jawne ustawienie
- wartości z jednostkami zapisuj jako `TimeSpan`, `Uri`, `int` z nazwą jednostki albo własny typ
- unikaj magicznych stringów dla nazw sekcji

Przykład:

```csharp
builder.Services
    .AddOptions<PaymentsOptions>()
    .Bind(builder.Configuration.GetSection("Payments"))
    .ValidateDataAnnotations()
    .Validate(options => options.Timeout > TimeSpan.Zero, "Payments timeout must be positive.")
    .ValidateOnStart();
```

Options pattern daje typowany dostęp do grup konfiguracji i mechanizmy walidacji danych konfiguracyjnych[^options].
## DTO, kontrakty i mapowanie

Zasady:

- oddzielaj DTO wejściowe od modeli domenowych
- oddzielaj DTO wyjściowe od encji EF
- nie zwracaj encji EF bezpośrednio z API
- nie przyjmuj encji EF jako body requestu
- DTO powinno reprezentować kontrakt API, a nie strukturę tabel
- walidacja requestu powinna być przy granicy API
- walidacja invariantów domenowych powinna być w domenie
- mappery trzymaj proste i jawne
- AutoMapper stosuj ostrożnie, gdy mapowania są mechaniczne
- dla trudnych mapowań preferuj jawny kod
- nie pozwalaj klientowi ustawiać pól systemowych: `Id`, `TenantId`, `CreatedAt`, `CreatedBy`, `Status`, `Version`
- używaj osobnych request DTO dla create/update/patch
- dla PATCH stosuj świadomy model zmian, nie automatyczne patchowanie encji
## Walidacja danych wejściowych

Zasady:

- waliduj request body, route params, query params i headers
- sprawdzaj zakresy, długości, formaty, enumy, nullability i zależności między polami
- nie ufaj walidacji frontendowej
- walidacja syntaktyczna powinna być oddzielona od reguł domenowych
- walidacja powinna zwracać spójny format błędów
- nie ujawniaj szczegółów implementacji w błędach walidacji
- błędy walidacji powinny być stabilne dla klientów API
- dla importów i batchy rozważ częściowe błędy per rekord
- dla publicznego API dokumentuj ograniczenia w OpenAPI

Minimal APIs w .NET 10 mają wbudowane mechanizmy validation i możliwość dostosowania odpowiedzi walidacyjnych przez `IProblemDetailsService`[^minimal-apis].
## Obsługa błędów i ProblemDetails

Zasady:

- używaj spójnego formatu błędów, najlepiej RFC 7807 / Problem Details
- nie zwracaj stack trace do klienta
- mapuj błędy domenowe na statusy HTTP w jednym miejscu
- `400` używaj dla błędnych danych wejściowych
- `401` dla braku uwierzytelnienia
- `403` dla braku uprawnień
- `404` dla braku zasobu albo celowego ukrycia jego istnienia
- `409` dla konfliktów stanu, wersji, idempotencji albo unique constraint
- `422` rozważ dla poprawnego JSON-a, który nie spełnia reguł biznesowych
- `429` dla rate limitu
- `500` dla nieobsłużonych błędów
- nie mapuj wszystkich wyjątków na `500` bez logowania
- nie łap `Exception`, jeśli nie dodajesz kontekstu albo nie mapujesz błędu
- wyjątki traktuj jako mechanizm dla błędów wyjątkowych, nie normalnego flow domenowego
- dla błędów oczekiwanych rozważ `Result<T>` albo typowane błędy aplikacyjne

ASP.NET Core ma wbudowany `IProblemDetailsService` oraz `AddProblemDetails`, które pozwalają spójnie opisywać błędy HTTP API[^problem-details].
