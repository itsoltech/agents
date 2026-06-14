# postgres-review Reference Sector: PgBouncer - konfiguracja i monitoring

## Zawartość

- PgBouncer - konfiguracja i monitoring
- PgBouncer - edge case'y produkcyjne
- Migracje schematu
- Migracje danych
- Backupy

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
## Migracje schematu

- migracje muszą być wersjonowane w repozytorium
- migracje muszą być uruchamiane dokładnie raz na środowisko
- migracje powinny być testowane na kopii danych zbliżonej do produkcji
- każda migracja produkcyjna powinna mieć ocenę blokad, czasu wykonania, miejsca na dysku i WAL
- unikaj migracji, które przepisują całą dużą tabelę w godzinach ruchu
- używaj expand/contract dla zmian kompatybilnych z rolling deploy
- najpierw dodawaj nowe kolumny jako nullable albo z bezpiecznym defaultem
- backfill rób partiami
- po backfillu dodawaj constraints i `NOT NULL`
- usuwaj stare kolumny dopiero po wdrożeniu aplikacji, która już ich nie używa
- przy dużych tabelach unikaj `ALTER TABLE ... ADD COLUMN ... DEFAULT` bez sprawdzenia wersji i skutków
- przy tworzeniu indeksów na dużych tabelach używaj `CREATE INDEX CONCURRENTLY`
- przy dodawaniu foreign key do dużej tabeli rozważ `NOT VALID` i później `VALIDATE CONSTRAINT`
- migracje DDL powinny mieć `lock_timeout`
- migracje danych powinny mieć checkpoint/restartability
- nie mieszaj ogromnego backfillu z deployem kodu, jeśli można go uruchomić jako osobny job
- każdy rollback migracji danych powinien być opisany, nawet jeśli technicznie będzie roll-forward
- po migracji danych uruchom `ANALYZE` dla dotkniętych tabel
- po migracji testuj najważniejsze query plans

Schemat expand/contract:

```text
1. expand:
   - dodaj nową nullable kolumnę
   - dodaj kod zapisujący starą i nową kolumnę
   - wdrożenie aplikacji

2. backfill:
   - uzupełnij nową kolumnę partiami
   - monitoruj locki, WAL, replikację i czas zapytań

3. enforce:
   - dodaj constraint
   - zmień aplikację na odczyt z nowej kolumny

4. contract:
   - usuń stary kod
   - usuń starą kolumnę w osobnej migracji
```
## Migracje danych

- backfill powinien działać partiami po primary key albo po zakresie czasu
- każda partia powinna mieć limit czasu i limit liczby wierszy
- job powinien zapisywać postęp
- job powinien być idempotentny
- job powinien mieć retry z limitem
- nie wykonuj jednego `UPDATE` na setkach milionów wierszy bez planu WAL, vacuum i replikacji
- monitoruj replication lag podczas dużych migracji
- monitoruj bloat po masowych update/delete
- po dużym backfillu zaplanuj vacuum/analyze
- jeśli backfill dotyka często używanej tabeli, ogranicz tempo
- przy danych krytycznych zrób reconcile query przed i po migracji
- przed usunięciem starych danych zrób snapshot albo backup logiczny wybranych tabel
- nie zmieniaj semantyki danych bez testu kompatybilności z raportami i integracjami

Przykład batch update:

```sql
WITH batch AS (
    SELECT id
    FROM orders
    WHERE migrated_at IS NULL
    ORDER BY id
    LIMIT 1000
    FOR UPDATE SKIP LOCKED
)
UPDATE orders o
SET migrated_at = now()
FROM batch
WHERE o.id = batch.id;
```
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
