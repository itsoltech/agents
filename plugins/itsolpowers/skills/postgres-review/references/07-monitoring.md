# postgres-review Reference Sector: Monitoring

## Zawartość

- Monitoring
- Logowanie
- Testy i QA
- Scenariusze testowe dla edge case'ów

## Monitoring

Monitoruj co najmniej:

- dostępność primary
- dostępność replik
- liczbę połączeń
- aktywne i czekające zapytania
- `idle in transaction`
- query latency i slow queries
- locks i deadlocks
- CPU, RAM, I/O latency, dysk
- WAL generation rate
- checkpoint frequency i checkpoint duration
- replication lag
- replication slots i retained WAL
- backup status
- restore test age
- autovacuum activity
- dead tuples
- transaction ID age
- temp files
- cache hit ratio, ale nie traktuj go jako jedynej metryki
- database size, table size, index size
- bloat table/index
- failed logins i błędy auth
- migration duration i migration failures

Rozszerzenia i widoki:

- `pg_stat_activity`
- `pg_stat_database`
- `pg_stat_user_tables`
- `pg_stat_user_indexes`
- `pg_stat_statements`
- `pg_locks`
- `pg_stat_replication`
- `pg_replication_slots`
- `pg_stat_bgwriter` / checkpoint stats zależne od wersji
- `auto_explain` dla trudnych incydentów
- `pgstattuple` do analizy bloat, jeśli akceptujesz koszt pomiaru
- `pg_stat_kcache` jako opcjonalne rozszerzenie do kosztów systemowych

Wolne zapytania:

```sql
SELECT
    queryid,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    rows,
    shared_blks_hit,
    shared_blks_read,
    temp_blks_written,
    query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

Aktywne zapytania:

```sql
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    wait_event_type,
    wait_event,
    now() - query_start AS query_duration,
    now() - xact_start AS transaction_duration,
    query
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY query_duration DESC;
```
## Logowanie

- ustaw `log_line_prefix` tak, żeby zawierał czas, pid, database, user, application_name i client
- ustaw `application_name` w aplikacjach i workerach
- włącz `log_min_duration_statement` na rozsądnym poziomie albo przez sampling
- włącz `log_lock_waits`
- ustaw `deadlock_timeout` świadomie
- logi mogą zawierać dane z zapytań, więc traktuj je jako dane wrażliwe
- nie ustawiaj `log_statement = 'all'` na produkcji bez krótkiego, kontrolowanego okna diagnostycznego
- rozważ `auto_explain` czasowo dla wolnych zapytań, ale kontroluj narzut i ilość logów
- logi muszą być rotowane i wysyłane do centralnego systemu
- alertuj na błędy FATAL/PANIC, failed auth, brak miejsca i problemy z archiwizacją WAL
## Testy i QA

Testy aplikacyjne powinny obejmować:

- duplicate insert i conflict handling
- race condition przy równoczesnym tworzeniu tego samego zasobu
- transakcję przerwaną w połowie
- retry po deadlock
- retry po serialization failure
- timeout zapytania
- timeout acquire connection
- utratę połączenia z bazą
- failover primary
- read-after-write przy read replicas
- replication lag
- długą transakcję blokującą migrację
- migrację wykonywaną dwa razy
- rollback/roll-forward po nieudanym deployu
- brak indeksu na dużych danych
- nieaktualne statystyki
- puste wyniki, duże wyniki, bardzo duże wartości, nietypowe znaki Unicode
- cross-tenant access
- soft deleted records
- RLS SELECT/INSERT/UPDATE/DELETE
- backup restore na osobne środowisko
- uszkodzony albo brakujący segment WAL w teście DR
- zapełniony dysk
- nieaktywny replication slot
- blokadę przez `idle in transaction`
- pool exhaustion
- read-only transaction error po failover
## Scenariusze testowe dla edge case'ów

### Auth i tenanty

- użytkownik A próbuje odczytać rekord tenanta B przez ID
- użytkownik A próbuje update/delete rekordu tenanta B
- export CSV/Excel zawiera dane tylko jednego tenanta
- search/global autocomplete nie zwraca danych innego tenanta
- websocket/live events nie wysyłają danych innego tenanta
- RLS blokuje zapis z obcym `tenant_id`
- admin tenantowy nie ma dostępu do danych globalnych

### Współbieżność

- dwa requesty tworzą ten sam unikalny zasób
- dwa workery pobierają ten sam job
- retry requestu po timeout wykonuje się drugi raz
- update zasobu po stronie A i B zachodzi równolegle
- deadlock jest wykryty i retry działa tylko dla bezpiecznych operacji
- idempotency key zwraca poprzedni wynik

### Migracje

- stara wersja aplikacji działa z nowym schematem
- nowa wersja aplikacji działa ze starym schematem w okresie rolling deploy
- backfill można zatrzymać i wznowić
- constraint dodany jako `NOT VALID` zostaje poprawnie zwalidowany
- indeks tworzony concurrently nie zostawia invalid index po przerwaniu
- migracja nie blokuje najważniejszych endpointów

### Replikacja i HA

- primary zostaje zatrzymany
- stary primary wraca po failover
- aplikacja odświeża pulę połączeń
- read replica ma lag większy niż limit
- endpoint wymagający read-your-writes nie czyta z repliki
- backup nadal działa po failover
- WAL archiving działa po promocji nowego primary

### Backup i restore

- restore do ostatniego backupu
- PITR do konkretnego timestampu
- restore bez jednego segmentu WAL
- restore na inną nazwę bazy
- restore z maskowaniem danych
- restore po major upgrade
- restore z brakującym extension
- restore z ograniczonymi uprawnieniami
