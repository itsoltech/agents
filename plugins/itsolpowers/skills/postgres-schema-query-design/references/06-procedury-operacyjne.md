# postgres-schema-query-design Reference Sector: Procedury operacyjne

## Zawartość

- Procedury operacyjne
- Minimalny zestaw ustawień dla aplikacji

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
## Minimalny zestaw ustawień dla aplikacji

Te wartości nie są gotową konfiguracją produkcyjną. To lista parametrów, które powinny być świadomie ustawione albo omówione:

```sql
ALTER ROLE app_user SET statement_timeout = '30s';
ALTER ROLE app_user SET lock_timeout = '2s';
ALTER ROLE app_user SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE app_user SET application_name = 'app-api';
```

Na poziomie aplikacji:

```text
DATABASE_URL_POOLED
DATABASE_URL_DIRECT
DATABASE_URL_MIGRATIONS
DATABASE_URL_READONLY
DB_POOL_MAX
DB_POOL_MIN
DB_POOL_ACQUIRE_TIMEOUT
DB_QUERY_TIMEOUT
DB_MIGRATION_LOCK_TIMEOUT
DB_READ_REPLICA_MAX_LAG
DB_STATEMENT_TIMEOUT
DB_PREPARED_STATEMENTS_MODE
DB_STATEMENT_CACHE_CAPACITY
```

Na poziomie operacyjnym:

```text
backup schedule
WAL archive destination
retention
restore test schedule
replication lag alert
disk space alert
WAL growth alert
failed auth alert
long transaction alert
lock wait alert
autovacuum lag alert
PgBouncer cl_waiting alert
PgBouncer maxwait alert
PgBouncer avg_wait_time alert
PgBouncer prepared statement errors alert
PgBouncer reconnect/failover runbook
```
