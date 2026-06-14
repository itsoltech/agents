# postgres-review Reference Sector: Statystyki plannerowe

## Zawartość

- Statystyki plannerowe
- Transakcje
- Blokady i współbieżność
- Persistence aplikacji
- Liczba połączeń i capacity planning

## Statystyki plannerowe

- autovacuum uruchamia też analyze, ale progi domyślne mogą być zbyt wysokie dla dużych tabel
- po dużym imporcie danych uruchom `ANALYZE`
- dla kolumn o nierównym rozkładzie rozważ zwiększenie statistics target
- dla skorelowanych kolumn rozważ extended statistics
- nie zakładaj, że planner zna zależności między `tenant_id`, `status`, `region`, `created_at`
- sprawdzaj `pg_stats` dla kolumn używanych w filtrach
- po migracji danych albo zmianie dystrybucji danych zaplanuj `ANALYZE`
- przy problemach z planami sprawdzaj, czy bind parameters i generic plans nie powodują złych decyzji

Przykłady:

```sql
ALTER TABLE orders ALTER COLUMN status SET STATISTICS 1000;
ANALYZE orders;

CREATE STATISTICS orders_tenant_status_stats
ON tenant_id, status
FROM orders;

ANALYZE orders;
```
## Transakcje

- każda transakcja powinna być możliwie krótka
- nie trzymaj transakcji podczas zewnętrznego HTTP, pracy CPU, oczekiwania na użytkownika albo długiego streamingu
- nie zostawiaj sesji `idle in transaction`
- ustaw `idle_in_transaction_session_timeout`
- ustaw `statement_timeout` dla aplikacji i zapytań administracyjnych
- ustaw `lock_timeout` dla migracji i operacji DDL
- nie wykonuj wielu niezależnych operacji w jednej ogromnej transakcji
- dla batchy commituj partiami, jeśli spójność biznesowa na to pozwala
- obsługuj deadlock i serialization failure przez kontrolowany retry
- retry musi być idempotentny albo ograniczony do całej transakcji
- nie retryuj pojedynczego statementu, jeśli transakcja jest już w stanie błędu
- przy `SERIALIZABLE` aplikacja musi być gotowa na retry transakcji
- domyślne `READ COMMITTED` jest poprawne dla wielu aplikacji, ale nie daje snapshotu całej operacji
- dla raportów wymagających spójnego snapshotu rozważ `REPEATABLE READ`
- dla kolejek używaj `FOR UPDATE SKIP LOCKED`
- dla blokad biznesowych rozważ advisory locks, ale dokumentuj klucz i zakres blokady

Przykład timeoutów dla roli aplikacyjnej:

```sql
ALTER ROLE app_user SET statement_timeout = '30s';
ALTER ROLE app_user SET lock_timeout = '2s';
ALTER ROLE app_user SET idle_in_transaction_session_timeout = '30s';
```
## Blokady i współbieżność

- każdy DDL na produkcji analizuj pod kątem blokad
- `ALTER TABLE` może blokować zapisy albo całą tabelę zależnie od operacji
- `CREATE INDEX` bez `CONCURRENTLY` blokuje zapisy
- `VACUUM FULL` bierze exclusive lock i przepisuje tabelę
- długie transakcje blokują vacuum przed usuwaniem starych wersji wierszy
- długie query na replice może zwiększać konflikty replikacji albo opóźnienie
- lock contention diagnozuj przez `pg_stat_activity` i `pg_locks`
- przed migracją sprawdź, czy istnieją długie transakcje
- migracje powinny mieć `lock_timeout`, żeby nie zamrozić aplikacji
- unikaj ręcznych locków tabelowych bez procedury awaryjnej
- kolejność aktualizacji wielu tabel powinna być spójna w całej aplikacji, żeby ograniczyć deadlocki
- jeśli używasz advisory locks, dodaj monitoring i timeout

Wykrywanie blokad:

```sql
SELECT
    blocked.pid AS blocked_pid,
    blocked.query AS blocked_query,
    blocking.pid AS blocking_pid,
    blocking.query AS blocking_query,
    now() - blocking.query_start AS blocking_duration
FROM pg_stat_activity blocked
JOIN pg_locks blocked_locks
    ON blocked_locks.pid = blocked.pid
JOIN pg_locks blocking_locks
    ON blocking_locks.locktype = blocked_locks.locktype
   AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
   AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
   AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
   AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
   AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
   AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
   AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
   AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
   AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
   AND blocking_locks.pid <> blocked_locks.pid
JOIN pg_stat_activity blocking
    ON blocking.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted
  AND blocking_locks.granted;
```
## Persistence aplikacji

- każde użycie bazy powinno mieć jasny model transakcyjny
- repository/service nie powinno ukrywać długich transakcji przed wyższą warstwą
- unikaj magicznego lazy loadingu, który generuje N+1 queries
- operacje zapisujące powinny być idempotentne albo mieć deduplikację
- dla requestów z retry używaj idempotency key
- dla integracji zewnętrznych używaj outbox pattern, jeśli zapis w DB i wysłanie eventu muszą być spójne
- nie wysyłaj eventu do brokera przed commitem transakcji, jeśli event opisuje zapis w DB
- przy inbox pattern deduplikuj eventy po `message_id`
- zapisuj timestamps po stronie DB albo po stronie aplikacji konsekwentnie
- używaj `timestamptz`, nie `timestamp without time zone`, jeśli czas oznacza moment w czasie
- nie zapisuj lokalnych dat/czasów użytkownika bez strefy i kontekstu, jeśli mają znaczenie biznesowe
- soft delete wymaga partial indexes, filtrów w query, polityki retencji i procedury purge
- audit log powinien być append-only albo mieć osobne uprawnienia
- nie mieszaj danych audytowych z tabelą operacyjną, jeśli audyt musi mieć inną retencję
- przy cache aplikacyjnym zaplanuj invalidację po commicie
- nie opieraj poprawności biznesowej wyłącznie o cache
## Liczba połączeń i capacity planning

- `max_connections` w PostgreSQL jest limitem backendów procesu PostgreSQL, a nie limitem requestów aplikacji
- nie ustawiaj wysokiego `max_connections` jako pierwszej reakcji na błąd `too many clients already`
- każde połączenie PostgreSQL kosztuje pamięć, file descriptors, CPU scheduler i prywatne bufory operacji zapytań
- wysokie `max_connections` zmniejsza bezpieczny budżet dla `work_mem`, bo wiele sesji może równolegle wykonywać sorty, hashe i agregacje
- zawsze zostaw rezerwę na administratorów, monitoring, migracje, replikację, backupy i awaryjne połączenia
- licz połączenia jako sumę wszystkich instancji aplikacji, workerów, cronów, migracji, CLI, dashboardów i narzędzi BI
- nie licz tylko aktualnej liczby instancji; policz też autoscaling, rolling deploy, failover i chwilowe podwojenie liczby instancji
- osobno licz pule dla API, workerów, migracji, read replicas i jobów administracyjnych
- pool aplikacji powinien ograniczać równoległość zapytań, a nie tylko ukrywać koszt otwierania socketów
- jeżeli usługa ma 20 instancji i każda ma pool size 20, to sama ta usługa może otworzyć 400 połączeń
- PgBouncer zmniejsza liczbę połączeń do PostgreSQL, ale nie znosi potrzeby limitowania ruchu w aplikacji
- `max_client_conn` w PgBouncer oznacza liczbę połączeń klientów do PgBouncera, a nie liczbę połączeń do PostgreSQL
- `default_pool_size`, `max_db_connections`, `max_user_connections` i konfiguracje per database/per user określają realną liczbę połączeń serwerowych do PostgreSQL
- jeżeli aplikacje łączą się do PgBouncera różnymi użytkownikami albo do wielu baz, powstaje wiele osobnych pooli
- wzór na górny limit file descriptors w PgBouncer zależy od `max_client_conn`, liczby baz, liczby użytkowników i pool size
- przy PgBouncer zawsze ustaw limity systemowe `nofile` z zapasem
- nie ustawiaj `default_pool_size` większego niż realna liczba równoległych zapytań, które baza może obsłużyć
- zwiększenie puli może obniżyć latency tylko do momentu saturacji CPU/I/O/locków; potem zwiększa kolejki i timeouty
- dla requestów HTTP zwykle lepszy jest mniejszy, kontrolowany pool i szybki fail niż nieograniczona kolejka
- dla długich jobów używaj osobnej puli albo osobnego użytkownika PgBouncer z własnym limitem
- dla migracji i administracji zostaw direct connection albo osobną pulę sesyjną

Przykład liczenia bez PgBouncera:

```text
max_connections: 300
superuser/reserved/admin/monitoring/migracje: 50
dostępne dla aplikacji: 250
instancje API: 10
instancje workerów: 5
łącznie procesów aplikacyjnych: 15

bezpieczny pool per proces <= floor(250 / 15) = 16
```

Przykład liczenia z PgBouncerem:

```text
PostgreSQL max_connections: 300
rezerwa DB: 50
realny budżet server connections dla PgBouncer: 250

PgBouncer:
- default_pool_size = 30
- aplikacja używa 3 użytkowników DB
- aplikacja używa 2 baz

teoretyczny limit server connections = 30 * 3 * 2 = 180
```

Przy wielu użytkownikach albo bazach problemem bywa nie `max_client_conn`, tylko liczba osobnych pooli `(database, user)`.
