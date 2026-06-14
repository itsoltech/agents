# postgres-operations-debugging Reference Sector: Minimalny zestaw ustawień dla aplikacji

## Zawartość

- Minimalny zestaw ustawień dla aplikacji
- Minimalny zestaw komend PgBouncer dla diagnostyki

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
## Minimalny zestaw komend PgBouncer dla diagnostyki

Połączenie do konsoli administracyjnej PgBouncer zwykle wygląda jak połączenie do specjalnej bazy `pgbouncer` na porcie poolera.

```bash
psql "postgres://admin_user@pgbouncer-host:6432/pgbouncer"
```

Najważniejsze komendy:

```sql
SHOW POOLS;
SHOW STATS;
SHOW CLIENTS;
SHOW SERVERS;
SHOW DATABASES;
SHOW USERS;
SHOW CONFIG;
```

Interpretacja szybkiego review:

```text
cl_waiting > 0      - klienci czekają na server connection
maxwait rośnie      - pool nie obsługuje ruchu wystarczająco szybko
sv_active == limit  - pool jest wysycony
sv_idle == 0        - brak wolnych połączeń do PostgreSQL
avg_wait_time rośnie - requesty czekają w kolejce poolera
prepared_statements rośnie - działa named prepared statement tracking
```

Dane z PostgreSQL i PgBouncer trzeba zestawiać razem. Niskie CPU PostgreSQL przy wysokim `cl_waiting` zwykle oznacza problem z limitem poola, lockami, długimi transakcjami albo zbyt małą liczbą server connections, a nie samą mocą bazy.
