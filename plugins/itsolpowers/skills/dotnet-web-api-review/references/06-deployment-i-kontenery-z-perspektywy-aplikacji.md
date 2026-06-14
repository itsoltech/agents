# dotnet-web-api-review Reference Sector: Deployment i kontenery z perspektywy aplikacji

## Zawartość

- Deployment i kontenery z perspektywy aplikacji
- Migracje bazy
- Kiedy przemyśleć refactor
- Minimalny standard nowego API
- Checklist code review

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
## Kiedy przemyśleć refactor

Sygnały techniczne:

- zmiana jednego feature'a wymaga edycji wielu niepowiązanych miejsc
- kontrolery/endpointy mają po kilkaset linii
- logika biznesowa jest w mapperach, walidatorach albo EF query
- testy wymagają pełnego hosta dla każdej małej reguły
- duplikaty reguł pojawiają się w kilku modułach
- repository jest tylko cienką nakładką na `DbSet`
- serwisy mają nazwy typu `Manager`, `Helper`, `Processor`, ale robią wiele rzeczy
- `Common` rośnie szybciej niż moduły
- singletony przechowują stan requestu
- endpointy nie mają spójnego formatu błędów
- auth jest kopiowany ręcznie w wielu miejscach

Sygnały produktowe:

- domena zaczęła mieć nowe pojęcia i reguły
- kilka zespołów pracuje w tych samych plikach
- różne funkcjonalności wymagają osobnego release cadence
- część systemu ma dużo większy ruch niż reszta
- jeden moduł powoduje awarie całej aplikacji
- zmiany w DB blokują wiele funkcji
- publiczny kontrakt API wymaga wersjonowania

Kierunki refactoru:

- z grubych kontrolerów do application services
- z warstw technicznych do vertical slices
- z anemicznych DTO w domenie do value objects i aggregate methods
- z generycznego repository do jawnych queries i aggregate repositories
- z jednego katalogu `Services` do modułów
- z sync I/O do async
- z rozproszonego error handlingu do ProblemDetails
- z ręcznych ifów auth do policies
- z logów tekstowych do structured logs
- z lokalnych jobów do koordynowanych workerów
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
## Checklist code review

### Architektura

- czy wybrana architektura pasuje do rozmiaru aplikacji?
- czy nie dodano Clean Architecture/DDD/CQRS bez realnej potrzeby?
- czy feature jest w jednym miejscu?
- czy logika biznesowa nie jest w kontrolerze?
- czy domena nie zależy od ASP.NET Core/EF/HTTP?
- czy interfejsy mają więcej sensu niż tylko "łatwiejsze mockowanie"?
- czy repository nie ukrywa prostego EF bez korzyści?
- czy moduł ma jasne granice?

### API

- czy endpoint ma właściwy status HTTP?
- czy request/response DTO są oddzielone od encji?
- czy walidacja obejmuje body/query/route?
- czy błędy są zwracane jako ProblemDetails?
- czy pagination ma limit?
- czy OpenAPI jest aktualne?
- czy endpoint publiczny ma uzasadnienie?

### Security

- czy endpoint wymaga auth?
- czy autoryzacja jest per zasób?
- czy tenant isolation jest wymuszona?
- czy CORS jest zawężony?
- czy cookie auth ma CSRF?
- czy tokeny nie są logowane?
- czy sekrety nie są w kodzie?
- czy request body ma limit?
- czy upload jest bezpieczny?
- czy rate limiting chroni kosztowne endpointy?

### Data

- czy query jest wykonywane po stronie bazy?
- czy nie ma N+1 queries?
- czy odczyt używa `AsNoTracking`, gdy nie modyfikuje encji?
- czy nie ma `ToListAsync()` przed filtrowaniem?
- czy transakcja jest krótka?
- czy konflikty DB są mapowane na typowane błędy?
- czy migracja jest bezpieczna dla produkcyjnych danych?
- czy connection pool jest zgodny ze skalą deploymentu?

### Async i wydajność

- czy nie ma `.Result`, `.Wait()`, sync I/O?
- czy przekazano `CancellationToken`?
- czy nie użyto `Task.Run` jako obejścia?
- czy endpoint nie ładuje dużych danych do pamięci?
- czy HTTP clients są przez `IHttpClientFactory`?
- czy retry ma limit?
- czy timeouty są ustawione?
- czy hot path nie robi zbędnych alokacji?

### Testy

- czy reguły domenowe mają testy jednostkowe?
- czy endpoint ma test integracyjny?
- czy auth/authorization są testowane?
- czy DB query są testowane na realnym providerze?
- czy scenariusze błędów są pokryte?
- czy testy nie zależą od kolejności?
- czy testy obejmują idempotencję i concurrency?

### Observability

- czy logi mają trace/request id?
- czy błędy mają kontekst?
- czy logi nie zawierają danych wrażliwych?
- czy metryki pokażą latency, error rate i saturację?
- czy health checks są rozdzielone na live/ready?
- czy dependency calls są mierzone?
- czy background jobs mają status i logi?
