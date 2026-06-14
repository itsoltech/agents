# postgres-operations-debugging Reference Sector: Monitoring

## Zawartość

- Monitoring
- Logowanie

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
