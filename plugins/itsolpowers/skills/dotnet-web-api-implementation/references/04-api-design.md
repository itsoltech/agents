# dotnet-web-api-implementation Reference Sector: API design

## Zawartość

- API design
- OpenAPI
- Autoryzacja i uwierzytelnianie
- CORS, CSRF i przeglądarka
- Sekrety i dane wrażliwe
- Data Protection i wiele instancji
- Komunikacja HTTP z innymi usługami
- EF Core i dostęp do danych
- Transakcje i spójność

## API design

Zasady:

- nazwy endpointów powinny opisywać zasoby albo przypadki użycia
- używaj rzeczowników dla zasobów, czasowników tylko dla operacji niepasujących do CRUD
- nie projektuj API jeden do jednego pod tabele
- pagination, sorting i filtering projektuj od początku dla list
- endpoint listujący musi mieć limit
- nie zwracaj nieograniczonych kolekcji
- nie przyjmuj nieograniczonych payloadów
- rozróżniaj publiczne API od internal API
- wersjonuj API, jeśli kontrakt jest używany przez niezależnych klientów
- nie usuwaj pól z odpowiedzi bez okresu przejściowego
- dla zmian w enumach uwzględnij klientów, którzy nie znają nowych wartości
- nie używaj statusu `200` dla każdego przypadku
- dla create zwracaj `201` i lokalizację zasobu, jeśli to pasuje do API
- dla delete idempotentnego opisz zachowanie `404` vs `204`
- dla długich operacji rozważ `202 Accepted` i endpoint statusu
- request id / correlation id powinien przechodzić przez odpowiedzi i logi
## OpenAPI

Zasady:

- generuj OpenAPI w CI i sprawdzaj diff kontraktu
- publiczny kontrakt API traktuj jak artefakt wersjonowany
- request/response DTO powinny mieć opisy i ograniczenia
- dokumentuj statusy błędów
- dokumentuj auth scheme
- dokumentuj pagination, sorting, filtering
- dla enumów dokumentuj znaczenie wartości
- nie wystawiaj endpointów technicznych w publicznym OpenAPI bez potrzeby
- OpenAPI UI w produkcji wymaga kontroli dostępu albo wyłączenia
- build powinien wykrywać breaking changes w kontrakcie

ASP.NET Core od .NET 9 ma wbudowane wsparcie dla generowania OpenAPI, a .NET 10 dodaje obsługę OpenAPI 3.1[^openapi][^openapi31].
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
## Sekrety i dane wrażliwe

Zasady:

- sekrety nie mogą trafić do repozytorium
- sekrety nie mogą trafić do logów
- sekrety nie mogą trafić do OpenAPI examples
- sekrety nie mogą być zwracane w błędach
- development secrets trzymaj poza repo przez User Secrets albo lokalny secret manager
- User Secrets nie szyfruje wartości i nie jest production secret store
- produkcyjne sekrety trzymaj w secret managerze infrastruktury
- connection stringi z hasłami traktuj jak sekrety
- loguj identyfikatory operacji, nie pełne tokeny i payloady
- konfiguruj redakcję danych w logach
- rotuj sekrety i testuj rotację
- nie zapisuj długoterminowych sekretów w cache aplikacji bez powodu

Microsoft opisuje User Secrets jako mechanizm developerski poza drzewem projektu, ale nie jako szyfrowany, zaufany store[^secrets].
## Data Protection i wiele instancji

ASP.NET Core Data Protection zabezpiecza dane używane między innymi przez cookies, antiforgery tokens i inne mechanizmy kryptograficzne.

Zasady:

- w single instance default może wystarczyć
- w wielu instancjach współdziel key ring
- key ring musi być trwały między restartami
- wszystkie instancje tej samej aplikacji muszą mieć dostęp do zgodnych kluczy
- nie trzymaj key ring tylko w efemerycznym filesystemie kontenera
- chroń key ring przez storage i uprawnienia
- planuj rotację kluczy
- przy blue-green deployment sprawdź zgodność Data Protection między wersjami
- przy zmianie nazwy aplikacji / application discriminator sprawdź wpływ na deszyfrowanie danych

Domyślna konfiguracja Data Protection zapisuje osobny key ring na danym węźle. W web farmie różne węzły nie będą mogły odszyfrować danych chronionych przez inne węzły, jeśli key ring nie jest współdzielony[^data-protection][^webfarm].
## Komunikacja HTTP z innymi usługami

Zasady:

- używaj `IHttpClientFactory`
- preferuj typed clients dla klientów konkretnych usług
- nie twórz `new HttpClient()` per request
- ustawiaj `BaseAddress`, timeout, default headers i retry per klient
- nie ustawiaj globalnych nagłówków auth na współdzielonym kliencie, jeśli zależą od użytkownika
- przekazuj `CancellationToken`
- nie retryuj operacji nieidempotentnych bez idempotency key
- retry musi mieć limit i backoff
- używaj timeoutów krótszych niż timeout requestu przychodzącego
- rozróżniaj timeout, DNS, connection failure, `5xx`, `429`, `4xx`
- nie traktuj każdego `4xx` jako transient
- circuit breaker ma sens przy zależnościach, które realnie padają
- hedging może zwielokrotnić ruch i musi być użyty ostrożnie
- loguj status, czas, nazwę zależności i correlation id
- nie loguj pełnych URL-i z sekretami w query stringu
- dla payloadów zewnętrznych waliduj response DTO
- dla webhooks podpisuj i weryfikuj payloady

`IHttpClientFactory` zarządza konfiguracją klientów HTTP, logowaniem i lifetime `HttpMessageHandler`, co pomaga unikać problemów takich jak socket exhaustion i ignorowanie zmian DNS. Dla resilient HTTP Microsoft udostępnia pakiety `Microsoft.Extensions.Resilience` i `Microsoft.Extensions.Http.Resilience`[^httpclient][^http-resilience].
## EF Core i dostęp do danych

Zasady:

- `DbContext` jest scoped per request albo per unit of work
- nie przechowuj `DbContext` w singletonie
- nie współdziel `DbContext` między równoległymi taskami
- nie ukrywaj każdego zapytania za generycznym repository
- używaj `AsNoTracking()` dla odczytów bez modyfikacji
- projektuj query do DTO, jeśli nie potrzebujesz pełnych encji
- nie pobieraj całych encji tylko po to, żeby zwrócić kilka pól
- unikaj N+1 queries
- używaj eager loading świadomie
- split query stosuj tam, gdzie join tworzy eksplozję danych
- paginuj listy
- dla dużych list preferuj keyset pagination
- nie używaj `ToListAsync()` przed filtrowaniem, sortowaniem i paginacją
- używaj `AnyAsync()` zamiast `CountAsync() > 0`
- nie mieszaj długich operacji z otwartą transakcją
- dla masowych update/delete rozważ bulk operations albo SQL
- analizuj wygenerowany SQL
- dodawaj indeksy pod access patterns
- testuj query na realnej bazie albo Testcontainers, nie tylko in-memory provider
- nie traktuj EF InMemory jako testu relacyjnej bazy
- obsługuj optimistic concurrency, jeśli wiele osób może edytować ten sam zasób
- constraints w DB są częścią bezpieczeństwa i spójności, nie tylko optymalizacją

EF Core dokumentuje wydajne zapytania, indeksy, projekcje, loading related data, context pooling i batching update'ów jako obszary wpływające na wydajność[^ef-querying][^ef-advanced][^ef-updating].
## Transakcje i spójność

Zasady:

- transakcja powinna być krótka
- transakcja nie powinna obejmować zewnętrznego HTTP
- transakcja nie powinna czekać na użytkownika
- zapis wielu agregatów w jednej transakcji wymaga uzasadnienia
- dla integracji zewnętrznych używaj outbox pattern
- dla retry operacji zapisu stosuj idempotency key
- optimistic concurrency używaj przy edycji zasobów przez wielu użytkowników
- nie ignoruj wyjątków unique constraint
- mapuj konflikty DB na `409 Conflict`
- przy importach zapisuj postęp i błędy per rekord
- przy długich operacjach rozważ job zamiast requestu HTTP
