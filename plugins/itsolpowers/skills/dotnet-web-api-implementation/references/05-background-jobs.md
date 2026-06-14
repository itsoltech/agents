# dotnet-web-api-implementation Reference Sector: Background jobs

## Zawartość

- Background jobs
- Cache
- Rate limiting i abuse protection
- Health checks
- Observability
- Testowalny kod
- Rodzaje testów

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
## Testowalny kod

Zasady:

- logikę biznesową trzymaj poza kontrolerami i endpointami
- przypadki użycia testuj bez hosta HTTP, jeśli to możliwe
- endpointy testuj integracyjnie przez `WebApplicationFactory`
- zależności zewnętrzne ukrywaj za portami albo typed clients
- czas pobieraj przez `TimeProvider`, nie przez bezpośrednie `DateTime.UtcNow` w domenie
- ID generuj przez jawny provider, jeśli test wymaga deterministyczności
- unikaj statycznych singletonów z mutable state
- walidatory testuj osobno
- mappery testuj przy złożonym mapowaniu
- EF query testuj na realnym providerze zgodnym z produkcją
- external API mockuj przez fake HTTP handler, WireMock albo test double
- w testach integracyjnych używaj izolowanej bazy, transakcji albo Testcontainers
- test nie powinien zależeć od kolejności wykonania innych testów

ASP.NET Core wspiera testy integracyjne przez host testowy i in-memory test server. Microsoft rozdziela testy jednostkowe kontrolerów od integracyjnych testów pełnej ścieżki requestu[^integration-tests][^controller-tests].
## Rodzaje testów

### Testy jednostkowe

Stosuj dla:

- reguł domenowych
- walidatorów
- parserów
- mapperów złożonych
- kalkulacji
- policy/permissions
- command/query handlers bez I/O

Nie stosuj jako jedynego testu dla:

- EF queries
- routing
- model binding
- middleware
- auth
- integracji zewnętrznych

### Testy integracyjne

Stosuj dla:

- pełnej ścieżki HTTP
- auth + authorization
- walidacji requestu
- mapowania błędów
- EF Core + DB
- migracji
- zewnętrznych klientów przez fake server
- background jobs z bazą

### Testy kontraktowe

Stosuj dla:

- publicznego API
- API używanego przez frontend
- integracji między usługami
- webhooków
- generated clients

### Testy wydajnościowe

Stosuj dla:

- endpointów listujących
- wyszukiwania
- importów
- eksportów
- batch operations
- endpointów z zewnętrznymi API
- hot path logiki biznesowej

### Testy bezpieczeństwa

Stosuj dla:

- auth
- authorization per zasób
- tenant isolation
- uploadów
- SSRF
- CORS/CSRF
- rate limiting
- injection
- deserializacji
- endpointów administracyjnych
- logowania i redakcji danych
