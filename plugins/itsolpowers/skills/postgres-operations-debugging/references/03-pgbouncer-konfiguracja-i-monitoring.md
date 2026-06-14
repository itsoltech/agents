# postgres-operations-debugging Reference Sector: PgBouncer - konfiguracja i monitoring

## Zawartość

- PgBouncer - konfiguracja i monitoring
- PgBouncer - edge case'y produkcyjne
- Direct connection - kiedy omijać PgBouncer
- Backupy
- Point-in-time recovery
- Replikacja fizyczna i HA

## PgBouncer - konfiguracja i monitoring

- trzymaj konfigurację PgBouncera w repozytorium albo w IaC
- zmiany `pool_mode`, `default_pool_size`, `max_client_conn`, `max_db_connections`, `max_user_connections` i `max_prepared_statements` wymagają review
- ustaw `admin_users` i `stats_users`; nie dawaj dostępu do konsoli PgBouncera zwykłej roli aplikacyjnej
- monitoruj `SHOW POOLS`, `SHOW CLIENTS`, `SHOW SERVERS`, `SHOW STATS`, `SHOW DATABASES`, `SHOW LISTS`
- alertuj na rosnące `cl_waiting`, `maxwait`, brak `sv_idle`, wysokie `avg_wait_time`, częste reconnecty i błędy poolera
- `cl_waiting > 0` przez dłuższy czas oznacza, że klienci czekają na server connection
- rosnący `maxwait` oznacza kolejkę w poolerze, a niekoniecznie problem z samą autoryzacją albo siecią
- wysoki `avg_xact_time` zwykle oznacza długie transakcje albo wolne query
- wysoki `avg_wait_time` przy niskim CPU bazy może oznaczać zbyt mały pool size albo blokady
- wysoki `avg_wait_time` przy wysokim CPU/I/O bazy oznacza saturację bazy; zwiększenie pool size może pogorszyć sytuację
- `SHOW SERVERS` pozwala sprawdzić backendy PostgreSQL używane przez PgBouncer
- `SHOW CLIENTS` i `SHOW SERVERS` można łączyć przez `ptr` / `link`, żeby znaleźć powiązanie klient-server
- po zmianach DNS, failoverze albo zmianie backend route użyj `RECONNECT`, `PAUSE`, `RESUME` zgodnie z runbookiem
- `PAUSE` jest bezpieczniejsze przy planowanym restarcie PostgreSQL niż przypadkowe ubijanie połączeń
- dla wielu procesów PgBouncera za load balancerem skonfiguruj peering, żeby cancellation request trafiał do procesu obsługującego zapytanie
- PgBouncer jest single-threaded; jeśli jeden proces saturuje CPU, rozważ kilka procesów z `so_reuseport` i peeringiem
- przy `max_client_conn` ustawionym wysoko sprawdź `ulimit -n` i limity systemd
- przy TLS sprawdź, czy szyfrowanie działa na odcinku klient-PgBouncer i PgBouncer-PostgreSQL zgodnie z wymaganiami
- aktualizuj PgBouncer tak samo jak PostgreSQL; wersje poolera też miewają poprawki bezpieczeństwa

Podstawowe komendy diagnostyczne:

```sql
SHOW POOLS;
SHOW CLIENTS;
SHOW SERVERS;
SHOW STATS;
SHOW DATABASES;
SHOW CONFIG;
SHOW VERSION;
```

Pola, na które trzeba patrzeć w pierwszej kolejności:

```text
SHOW POOLS:
- cl_active
- cl_waiting
- sv_active
- sv_idle
- maxwait
- pool_mode

SHOW STATS:
- avg_xact_count
- avg_query_count
- avg_xact_time
- avg_query_time
- avg_wait_time
- total_client_parse_count
- total_server_parse_count
- total_bind_count
```
## PgBouncer - edge case'y produkcyjne

- aplikacja działa poprawnie lokalnie, ale produkcja rzuca `prepared statement does not exist`, bo lokalnie nie ma transaction poolingu
- aplikacja po deployu rzuca `cached plan must not change result type`, bo DDL zmienił shape wyniku przygotowanego zapytania
- tenant context przecieka, bo kod używa sesyjnego `SET app.tenant_id` zamiast `SET LOCAL` w transakcji
- zapytania trafiają do złego schematu, bo aplikacja polega na `search_path` ustawionym na początku połączenia
- migracje Prisma/ORM idą przez PgBouncer i psują się na prepared statements albo oczekiwaniu jednej stałej sesji
- background job trzyma długą transakcję i blokuje server connection w PgBouncerze
- aplikacja ma zbyt duży pool per instancja, a autoscaling powoduje wyczerpanie `max_client_conn` albo file descriptors
- `LISTEN/NOTIFY` przez transaction pooling nie działa stabilnie, bo listener wymaga stałej sesji
- session advisory lock znika albo blokuje nie ten backend, bo kod działa przez transaction pooling
- temp table utworzona w jednym zapytaniu nie istnieje w kolejnym
- `SET statement_timeout` wykonany raz nie działa na kolejne transakcje
- PgBouncer jest za TCP load balancerem, a cancellation request trafia do innego procesu PgBouncer niż query
- failover zmienia backend PostgreSQL, ale PgBouncer trzyma stare połączenia do czasu reconnect/reload
- provider managed pooler różni się od upstream PgBouncera i ma inne limity albo porty
## Direct connection - kiedy omijać PgBouncer

Direct connection albo session pooling powinny być używane dla:

- migracji schematu
- schema diff i introspekcji ORM
- manualnych operacji DBA
- backupów logicznych i narzędzi dump/restore
- logical replication i replication slots
- `LISTEN/NOTIFY` listenerów
- jobów wymagających session advisory locks
- operacji z temporary tables
- długiego `COPY` albo streamingu dużych wyników, jeśli trzyma server connection zbyt długo
- narzędzi BI, które używają zmiennych sesyjnych, temp tables albo długich transakcji
- testów diagnostycznych, które muszą widzieć prawdziwy backend PostgreSQL

Nie oznacza to, że direct connection ma być używany przez runtime API. Runtime API powinno zwykle używać PgBouncera, jeśli ruch jest krótki, requestowy i nie zależy od session state.
## Backupy

- backup musi mieć jasno opisane RPO i RTO
- backup musi być automatyczny
- backup musi być monitorowany
- backup musi być szyfrowany
- backup musi być testowany przez restore
- trzymaj backup poza hostem bazy
- trzymaj backup poza tym samym storage, który może zostać utracony razem z bazą
- dla produkcji preferuj fizyczne backupy plus WAL archiving, jeśli potrzebujesz PITR
- `pg_dump` jest dobry dla backupów logicznych, migracji małych baz, wybranych schematów i seedów testowych
- `pg_basebackup` tworzy fizyczny backup klastra i może być podstawą PITR albo standby
- narzędzia typu pgBackRest, WAL-G albo Barman ułatwiają backupy fizyczne, retencję, WAL archiving i restore
- nie zakładaj, że snapshot dysku jest poprawnym backupem bez koordynacji z PostgreSQL
- backup musi obejmować role, uprawnienia, extensions, konfigurację, `pg_hba.conf`, parametry, cron/job specs i sekrety potrzebne do restore
- backup aplikacyjny powinien być spójny z wersją schematu
- po major upgrade wykonaj nowy base backup
- test restore powinien być częścią procedury, nie zadaniem wykonywanym dopiero przy awarii

Minimalna procedura backup review:

```text
- gdzie jest backup
- jak jest szyfrowany
- kto ma dostęp
- jak długo jest trzymany
- jaki jest ostatni poprawny restore test
- ile trwa restore
- ile danych można utracić
- czy WAL archiving działa
- czy alert działa, gdy backup lub archiwizacja WAL przestanie działać
```
## Point-in-time recovery

- PITR wymaga base backupu i kompletnego archiwum WAL od czasu backupu do punktu odtworzenia
- WAL archiving musi być monitorowany
- brak jednego wymaganego segmentu WAL może zablokować odtworzenie do danego punktu
- nie usuwaj WAL tylko dlatego, że replika już go odczytała, jeśli WAL jest potrzebny do backupu
- restore test powinien obejmować odtworzenie do konkretnego timestampu albo LSN
- dokumentuj procedurę wyboru punktu odtworzenia
- po restore sprawdź spójność aplikacyjną, migracje, liczniki, integracje i joby
- po promowaniu odtworzonego klastra zabezpiecz aplikacje przed zapisem do starego primary
- restore na środowisko testowe musi maskować dane wrażliwe, jeśli dostęp ma szerszy zespół
## Replikacja fizyczna i HA

- PostgreSQL ma model primary/standby dla streaming replication
- standby może być hot standby i obsługiwać zapytania read-only
- streaming replication jest domyślnie asynchroniczna
- asynchroniczna replika może utracić ostatnie transakcje przy awarii primary
- synchronous replication zmniejsza ryzyko utraty danych, ale zwiększa latency commitów i zależność od standby
- dla HA nie wystarczy sama replika; potrzebny jest proces failover, routing i ochrona przed split-brain
- replikacja powinna używać dedykowanego użytkownika z `REPLICATION LOGIN`
- połączenia replikacyjne muszą być ograniczone w `pg_hba.conf`
- replication slots chronią przed utratą WAL przez standby, ale mogą zapełnić dysk, jeśli replika stoi za długo
- ustaw `max_slot_wal_keep_size` albo monitoring slotów, żeby ograniczyć ryzyko zapełnienia `pg_wal`
- monitoruj replication lag w bajtach i czasie
- monitoruj `pg_stat_replication`, `pg_stat_wal_receiver`, sloty i archiwizację WAL
- repliki do odczytu muszą mieć SLO opóźnienia, a aplikacja musi znać konsekwencje stale reads
- nie wysyłaj odczytu „read-your-writes" na replikę bez mechanizmu synchronizacji
- po failover stare primary musi zostać odcięte albo zreinitializowane
- procedura failback powinna być testowana, nie improwizowana

Podstawowe zapytania:

```sql
SELECT
    application_name,
    state,
    sync_state,
    write_lag,
    flush_lag,
    replay_lag,
    pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS bytes_lag
FROM pg_stat_replication;

SELECT
    slot_name,
    active,
    restart_lsn,
    wal_status,
    safe_wal_size
FROM pg_replication_slots;
```
