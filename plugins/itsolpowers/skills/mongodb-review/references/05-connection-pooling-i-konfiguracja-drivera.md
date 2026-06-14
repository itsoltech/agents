# mongodb-review Reference Sector: Connection pooling i konfiguracja drivera

## Zawartość

- Connection pooling i konfiguracja drivera
- Read concern, write concern i read preference
- Replica set
- Sharding
- Backup i restore
- Bezpieczeństwo

## Connection pooling i konfiguracja drivera

Klient MongoDB powinien być tworzony raz na proces i współdzielony przez aplikację. Tworzenie klienta per request prowadzi do nadmiaru połączeń, większej latencji i problemów z limitem connection pool.

Zasady:

- twórz `MongoClient` raz przy starcie procesu
- nie twórz klienta per request, per repository ani per job
- ustaw `serverSelectionTimeoutMS`, `connectTimeoutMS`, `socketTimeoutMS` zgodnie z wymaganiami aplikacji
- ustaw `maxPoolSize` na podstawie concurrency aplikacji i limitów klastra
- nie zwiększaj `maxPoolSize` bez sprawdzenia, czy baza i hosty to wytrzymają
- monitoruj wait time na connection pool
- przy wielu instancjach aplikacji licz łączną liczbę połączeń, nie tylko per proces
- zamykaj klienta przy graceful shutdown
- connection string powinien wskazywać replica set albo SRV record zgodnie z typem deploymentu
- nie commituj connection stringów z hasłem do repozytorium

Przykładowe parametry do świadomego ustawienia:

```text
serverSelectionTimeoutMS=5000
connectTimeoutMS=5000
socketTimeoutMS=30000
maxPoolSize=50
retryWrites=true
appName=my-service-production
```

Nie kopiuj tych wartości bez pomiaru. Są przykładem pól, które powinny być świadomie ustawione albo świadomie zostawione jako domyślne.
## Read concern, write concern i read preference

Read concern, write concern i read preference decydują o kompromisie między trwałością, spójnością, latencją i dostępnością.

Zasady:

- dla krytycznych zapisów używaj `w: "majority"`
- dla operacji, które muszą przetrwać awarię procesu, sprawdź zachowanie journalingu i `j`
- dla odczytów po zapisie w tym samym flow używaj primary albo sesji z causal consistency
- nie czytaj z secondary dla flow wymagającego najnowszych danych
- secondary reads mogą zwracać dane opóźnione względem primary
- read preference `secondaryPreferred` pasuje do raportów, eksportów i mniej krytycznych odczytów, ale nie do świeżego stanu UI po mutacji
- decyzję o read concern/write concern dokumentuj przy krytycznych kolekcjach
- nie zmieniaj globalnych ustawień concern bez testów aplikacji

Przykładowe klasy danych:

| Klasa danych | Write concern | Read preference | Uwagi |
|---|---:|---:|---|
| płatności, uprawnienia, zamówienia | majority | primary | preferuj spójność |
| cache techniczny | w:1 | primary/nearest | dopuszczalna utrata |
| raporty admina | majority albo domyślne | secondaryPreferred | akceptowalny lag |
| logi techniczne | w:1 albo majority zależnie od wymagań | secondaryPreferred | ustaw retencję |
| event outbox | majority | primary | utrata eventu może uszkodzić integrację |
## Replica set

Replica set zapewnia replikację danych i automatyczny failover. Standardem produkcyjnym powinien być replica set, nie pojedynczy standalone server.

Zasady:

- używaj minimum trzech data-bearing nodes dla produkcyjnych danych, jeśli wymagania dostępności na to pozwalają
- unikaj arbitra, jeśli możesz użyć pełnego data-bearing node
- nie używaj więcej niż jednego arbitra
- utrzymuj nieparzystą liczbę voting members, jeśli projektujesz klasyczny replica set
- używaj hostnames zamiast IP w konfiguracji replica set
- zapewnij pełną łączność sieciową między członkami replica set
- synchronizuj czas przez NTP
- monitoruj replication lag
- monitoruj stan primary/secondary
- testuj failover przed produkcją
- ustal procedurę node maintenance i rolling restart
- nie wykonuj ręcznych zmian replica set config bez planu rollback
- dokumentuj priority, votes, hidden/delayed members, jeśli ich używasz

Co testować:

- restart primary
- utrata jednego secondary
- chwilowy network partition
- opóźniony secondary
- primary election podczas dużego zapisu
- zachowanie aplikacji przy `NotPrimary`, `PrimarySteppedDown`, timeoutach i retry
- odczyt po zapisie podczas failover
## Sharding

Sharding służy do poziomego skalowania bardzo dużych danych albo bardzo wysokiego throughputu. Nie powinien być używany jako zamiennik indeksów, dobrego modelu danych albo wystarczającego hardware.

Sharding rozważ, gdy:

- pojedynczy replica set nie mieści danych albo working set
- write throughput przekracza możliwości jednego primary
- duże kolekcje rosną szybciej niż można je obsłużyć pionowo
- potrzebujesz izolacji dużych tenantów albo regionów
- masz jasno określony shard key i access patterns

Nie shardinguj, jeśli:

- problemem jest brak indeksu
- zapytania robią pełne skany przez zły filtr
- model danych ma niekontrolowane tablice
- nie masz obserwowalności i procedur backup/restore
- nie potrafisz wskazać shard key
- większość zapytań będzie scatter-gather
## Backup i restore

Strategia backupu musi odpowiadać na pytania:

- jakie jest RPO
- jakie jest RTO
- jak często wykonywany jest backup
- jak długo backup jest przechowywany
- czy backup jest szyfrowany
- kto ma dostęp do backupu
- gdzie backup jest przechowywany
- jak wygląda restore pełny
- jak wygląda restore wybranej bazy/kolekcji/tenanta
- kiedy ostatnio wykonano test restore

Zasady:

- dla Atlas używaj Cloud Backups i point-in-time recovery, jeśli wymagania tego potrzebują
- dla self-managed rozważ Ops Manager/Cloud Manager albo snapshoty storage z poprawną procedurą
- `mongodump` jest użyteczny, ale nie jest uniwersalną strategią backupu dla każdego klastra
- dla replica set używaj `--oplog`, jeśli potrzebujesz spójnego momentu zakończenia dumpa
- dla sharded cluster procedura backupu jest trudniejsza i wymaga zatrzymania balancera oraz kontroli zapisów, jeśli używasz dumpów/snapshotów self-managed
- backup powinien obejmować dane, indeksy, konfigurację, użytkowników, role i metadane klastra
- backup powinien być szyfrowany i przechowywany poza głównym hostem
- dostęp do backupów powinien być ograniczony i audytowany
- test restore powinien być regularny i udokumentowany
- test restore powinien mierzyć realne RTO
- po restore aplikacja powinna przejść smoke testy

Minimalna procedura restore test:

1. utwórz izolowane środowisko restore
2. przywróć backup
3. uruchom walidację kolekcji krytycznych
4. sprawdź indeksy
5. uruchom smoke testy aplikacji
6. sprawdź losową próbkę danych biznesowych
7. zmierz czas od rozpoczęcia restore do gotowości aplikacji
8. zapisz wynik testu
## Bezpieczeństwo

MongoDB powinno być traktowane jak krytyczny system przechowywania danych. Ochrona musi obejmować sieć, transport, autoryzację, sekrety, audyt, backupy i aplikację.

Zasady:

- włącz authentication i authorization
- używaj osobnych użytkowników per aplikacja/środowisko
- stosuj least privilege
- nie używaj kont administracyjnych w aplikacji
- nie używaj jednego użytkownika MongoDB dla wszystkich usług
- ogranicz dostęp sieciowy do bazy przez firewall/security groups/VPN/private network
- nie wystawiaj MongoDB publicznie do internetu
- używaj TLS dla połączeń klient-baza i między nodami, jeśli deployment tego wymaga
- dla replica set/sharded cluster używaj internal authentication, np. keyfile albo x.509
- sekrety trzymaj w secret managerze, Vault, Nomad variables albo bezpiecznym mechanizmie platformy
- nie loguj connection stringów, haseł ani tokenów
- backupy szyfruj i ograniczaj dostęp
- regularnie rotuj hasła i certyfikaty
- używaj audytu, jeśli wymagania compliance tego wymagają
- nie dawaj aplikacji uprawnień do `dropDatabase`, `dropCollection`, zarządzania użytkownikami ani konfiguracji klastra

Przykładowy podział użytkowników:

| Użytkownik | Uprawnienia | Zastosowanie |
|---|---|---|
| app-api | readWrite na bazie aplikacji | główne API |
| app-worker | readWrite na wybranych kolekcjach | worker asynchroniczny |
| app-readonly | read na wybranych kolekcjach | raporty / debug |
| migrator | dodatkowe uprawnienia na czas migracji | migracje danych |
| backup | role wymagane przez backup tooling | backup |
| admin | admin tylko dla operatorów | administracja |
