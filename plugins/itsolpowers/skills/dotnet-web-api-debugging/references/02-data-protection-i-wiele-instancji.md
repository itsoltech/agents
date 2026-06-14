# dotnet-web-api-debugging Reference Sector: Data Protection i wiele instancji

## Zawartość

- Data Protection i wiele instancji
- Komunikacja HTTP z innymi usługami
- EF Core i dostęp do danych
- Transakcje i spójność
- Background jobs
- Cache
- Rate limiting i abuse protection
- Health checks
- Observability

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
