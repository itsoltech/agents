# postgres-operations-debugging Reference Sector: Procedury operacyjne

## Zawartość

- Procedury operacyjne
- Minimalny zestaw SQL dla diagnostyki

## Procedury operacyjne

### Przed wdrożeniem zmiany DB

- sprawdź migracje na świeżej bazie
- sprawdź migracje na kopii z danymi produkcyjnymi
- sprawdź locki i czas wykonania
- sprawdź miejsce na dysku i WAL
- sprawdź wpływ na repliki
- sprawdź plan rollback/roll-forward
- sprawdź kompatybilność z rolling deploy
- sprawdź, czy backup jest aktualny
- sprawdź, czy alerty działają
- ustaw `lock_timeout` i `statement_timeout`

### Podczas incydentu DB

- nie restartuj bazy bez zebrania podstawowych danych
- zapisz `pg_stat_activity`
- zapisz locki
- zapisz top queries
- zapisz metryki CPU/RAM/I/O/dysk
- sprawdź logi PostgreSQL
- sprawdź replication lag
- sprawdź wolne miejsce
- sprawdź backup/WAL archiving
- jeśli trzeba zabić query, zacznij od `pg_cancel_backend`
- `pg_terminate_backend` stosuj świadomie
- nie zabijaj autovacuum prevent wraparound bez planu
- po incydencie zapisz root cause, timeline i działania zapobiegawcze

### Po incydencie

- dodaj brakujący alert
- dodaj brakujący dashboard
- dodaj test regresyjny
- popraw timeouty
- popraw indeks albo query
- popraw migrację
- popraw limity pooli
- zaktualizuj runbook
- sprawdź, czy podobny problem może wystąpić w innych bazach
## Minimalny zestaw SQL dla diagnostyki

Rozmiary baz:

```sql
SELECT
    datname,
    pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;
```

Rozmiary tabel i indeksów:

```sql
SELECT
    schemaname,
    relname,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS table_size,
    pg_size_pretty(pg_indexes_size(relid)) AS indexes_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 30;
```

Nieaktywne indeksy:

```sql
SELECT
    schemaname,
    relname,
    indexrelname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC
LIMIT 50;
```

Długie transakcje:

```sql
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    state,
    now() - xact_start AS xact_age,
    now() - query_start AS query_age,
    query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start ASC;
```

Sesje idle in transaction:

```sql
SELECT
    pid,
    usename,
    application_name,
    client_addr,
    now() - xact_start AS xact_age,
    query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY xact_start ASC;
```

Temp files per database:

```sql
SELECT
    datname,
    temp_files,
    pg_size_pretty(temp_bytes) AS temp_size
FROM pg_stat_database
ORDER BY temp_bytes DESC;
```

Replication slots:

```sql
SELECT
    slot_name,
    slot_type,
    active,
    restart_lsn,
    confirmed_flush_lsn,
    wal_status,
    safe_wal_size
FROM pg_replication_slots;
```

Tabela z największą liczbą dead tuples:

```sql
SELECT
    schemaname,
    relname,
    n_live_tup,
    n_dead_tup,
    round(n_dead_tup::numeric / nullif(n_live_tup + n_dead_tup, 0) * 100, 2) AS dead_pct,
    last_autovacuum,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 30;
```
