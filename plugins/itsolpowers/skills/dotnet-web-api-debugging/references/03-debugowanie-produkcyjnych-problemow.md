# dotnet-web-api-debugging Reference Sector: Debugowanie produkcyjnych problemów

## Zawartość

- Debugowanie produkcyjnych problemów
- Wydajność aplikacji
- Skalowanie aplikacji
- Rodzaje testów
- Deployment i kontenery z perspektywy aplikacji

## Debugowanie produkcyjnych problemów

Pierwsze pytania:

- jaki endpoint/job/integracja jest dotknięta?
- kiedy problem się zaczął?
- czy problem koreluje z deployem, migracją, zmianą konfiguracji albo wzrostem ruchu?
- czy dotyczy jednej instancji czy wszystkich?
- czy rośnie CPU, pamięć, GC, thread pool, DB connections, latency?
- czy błędy są po stronie aplikacji, bazy, sieci, proxy, auth providera albo zewnętrznego API?
- czy problem jest zależny od konkretnego tenanta, użytkownika, payloadu albo rozmiaru danych?

Narzędzia:

- logi strukturalne z trace id
- metryki runtime i ASP.NET Core
- `dotnet-counters` do szybkiej obserwacji runtime
- `dotnet-trace` do trace'ów bez natywnego profilera
- `dotnet-dump` do dumpów procesu
- Application Insights / OpenTelemetry / Prometheus / Grafana / Loki
- slow query log i `EXPLAIN` po stronie bazy
- HTTP access logs z reverse proxy
- distributed tracing dla requestów przechodzących przez wiele usług

Przykładowe komendy:

```bash
dotnet-counters monitor --process-id <pid> System.Runtime Microsoft.AspNetCore.Hosting

dotnet-trace collect --process-id <pid> --duration 00:00:30

dotnet-dump collect --process-id <pid>
```

Microsoft dokumentuje `dotnet-counters` jako narzędzie do pierwszej obserwacji health/performance, `dotnet-trace` jako cross-platform trace collector oparty o EventPipe, oraz możliwość zbierania diagnostyki w Linux containers[^diagnostics][^dotnet-trace][^containers-diagnostics].
## Wydajność aplikacji

Zasady:

- nie blokuj async przez `.Result`, `.Wait()` albo `GetAwaiter().GetResult()`
- nie używaj `Task.Run` tylko po to, żeby natychmiast zrobić `await`
- przekazuj `CancellationToken`
- nie wykonuj sync I/O w request path
- unikaj locków w częstych ścieżkach
- nie ładuj dużych requestów/response do pamięci bez limitu
- używaj streamingu dla dużych plików
- projektuj endpointy tak, żeby wykonywały minimalną liczbę query
- cache'uj dane statyczne i wolnozmienne
- zmniejsz payload przez projekcje DTO
- używaj response compression dla dużych tekstowych payloadów po testach
- nie kompresuj małych payloadów, jeśli CPU jest problemem
- `GC.Collect()` nie powinien być używany w produkcyjnej ścieżce requestu
- unikaj alokacji w hot path, jeśli profiler pokazuje problem
- dla JSON rozważ source generation przy wymaganiach AOT, trimming albo wysokiej wydajności
- benchmarkuj przed i po zmianie
- testuj p95 i p99 latency, nie tylko średnią

Microsoft zaleca unikanie blokowania async przez `Task.Wait`/`Result` i nieużywanie `Task.Run` jako obejścia w ASP.NET Core request path. Dokumentacja pamięci ASP.NET Core ostrzega, że ręczne `GC.Collect()` w produkcji może pogorszyć wydajność[^aspnet-best][^memory]. `System.Text.Json` source generation może poprawić wydajność, zmniejszyć prywatną pamięć i wspierać trimming[^json-sourcegen].
## Skalowanie aplikacji

Zasady:

- proces API powinien być stateless, jeśli ma być łatwo skalowany poziomo
- sesje użytkowników trzymaj poza pamięcią procesu albo unikaj sesji
- Data Protection key ring musi być współdzielony między instancjami
- cache lokalny jest per instancja i może dawać niespójności
- background joby wymagają koordynacji między instancjami
- rate limiting lokalny nie jest globalnym limitem
- health checks muszą współpracować z load balancerem
- readiness powinien blokować ruch do instancji, która nie jest gotowa
- graceful shutdown powinien pozwolić dokończyć requesty
- timeouty muszą być spójne między proxy, aplikacją, klientem HTTP i bazą
- skalowanie API nie naprawia bottlenecku bazy
- connection pool DB musi być policzony względem liczby instancji
- duże eksporty/importy przenieś do jobów
- długie requesty HTTP utrudniają deployment i retry
- dla real-time wybierz SignalR/WebSocket/SSE z planem skalowania i backplane, jeśli wymaga tego topologia
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
