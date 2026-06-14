# dotnet-web-api-debugging Reference Sector: Overview

## Zawartość

- Overview
- Program.cs i składanie aplikacji
- Middleware
- Dependency injection
- Konfiguracja i options pattern
- Obsługa błędów i ProblemDetails
- Autoryzacja i uwierzytelnianie
- CORS, CSRF i przeglądarka


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
## Autoryzacja i uwierzytelnianie

Zasady:

- rozdziel authentication od authorization
- nie zakładaj, że zalogowany użytkownik ma dostęp do zasobu
- każda operacja po ID zasobu musi sprawdzać dostęp do tego konkretnego zasobu
- sprawdzaj tenant isolation w każdej ścieżce dostępu do danych
- preferuj policy-based authorization zamiast rozsianych `if (User.IsInRole(...))`
- dla zasobów używaj resource-based authorization, gdy decyzja zależy od właściciela, tenant ID, statusu albo relacji
- role są za grube dla wielu systemów; używaj claims, permissions albo policies
- nie ufaj `TenantId`, `UserId`, `Role` z request body
- nie ufaj nagłówkom identyfikującym użytkownika, jeśli nie są ustawiane przez zaufane proxy/auth gateway
- dla JWT waliduj issuer, audience, lifetime, podpis i clock skew
- nie loguj tokenów
- nie zapisuj tokenów w miejscach dostępnych dla XSS
- dla cookie auth ustaw `HttpOnly`, `Secure`, `SameSite`
- dla cookie auth obsłuż CSRF
- dla publicznych API rozważ rate limiting i detekcję abuse
- dla maszyn i integracji używaj osobnych client credentials albo API keys z rotacją

ASP.NET Core rozróżnia authentication jako ustalenie tożsamości i authorization jako decyzję o dostępie. Framework wspiera policy-based authorization, requirements i handlers[^auth][^authorization]. OWASP API Security Top 10 wskazuje Broken Object Level Authorization jako pierwsze ryzyko dla API, co bezpośrednio dotyczy endpointów operujących na ID zasobów[^owasp-api].
## CORS, CSRF i przeglądarka

Zasady:

- CORS nie jest mechanizmem autoryzacji
- nie ustawiaj `AllowAnyOrigin` razem z credentials
- ustawiaj jawne originy dla środowisk
- nie dopuszczaj wildcardów dla paneli administracyjnych i API z cookies
- dla cookie-based auth używaj CSRF protection
- dla bearer token API CSRF zwykle nie jest głównym ryzykiem, ale XSS nadal jest
- nie mieszaj cookie auth i bearer token auth bez jasnej decyzji
- preflight powinien być obsłużony przez middleware, a nie custom kod
- dla SignalR/WebSocketów dopuszczaj tylko zaufane originy

ASP.NET Core CORS opiera się na browser same-origin policy i powinien dopuszczać wyłącznie originy, którym aplikacja ufa[^cors].
