# postgres-review Reference Sector: Checklist do code review

## Zawartość

- Checklist do code review

## Checklist do code review

### Model danych

- czy tabela ma primary key?
- czy kolumny wymagane są `NOT NULL`?
- czy invariants są wyrażone przez constraints?
- czy unique constraints uwzględniają tenant context?
- czy typy danych odpowiadają znaczeniu danych?
- czy `jsonb` jest uzasadniony?
- czy soft delete ma partial indexes i politykę retencji?
- czy timestamps używają `timestamptz`?

### Zapytania

- czy zapytanie ma bind parameters?
- czy zapytanie ma limit/paginację?
- czy zapytanie wybiera tylko potrzebne kolumny?
- czy query plan był sprawdzony dla dużych danych?
- czy zapytanie używa indeksu zgodnego z filtrem i sortowaniem?
- czy nie ma N+1?
- czy nie ma dużego OFFSET?
- czy read-after-write nie idzie na replikę?
- czy endpoint nie wymaga zbyt wielu round-tripów do bazy?

### Indeksy

- czy każdy nowy indeks ma konkretny query use case?
- czy indeks nie dubluje istniejącego?
- czy kolejność kolumn w composite index jest uzasadniona?
- czy partial index pasuje do WHERE?
- czy expression index dokładnie pasuje do wyrażenia w query?
- czy indeks na produkcji jest tworzony concurrently?
- czy koszt zapisu po dodaniu indeksu został oceniony?
- czy nie trzeba usunąć starego indeksu po zmianie?

### Transakcje

- czy transakcja jest krótka?
- czy nie obejmuje zewnętrznego HTTP?
- czy nie obejmuje długiego CPU albo streamingu?
- czy obsługuje deadlock/serialization failure?
- czy retry jest idempotentny?
- czy isolation level jest świadomie dobrany?
- czy nie ma `idle in transaction`?
- czy transakcja ma timeout?

### Połączenia i PgBouncer

- czy liczba połączeń została policzona dla aktualnego deployu, rolling deployu i autoscalingu?
- czy pool size aplikacji nie przekracza budżetu połączeń po uwzględnieniu wszystkich instancji?
- czy PgBouncer `max_client_conn` i `default_pool_size` są policzone razem z liczbą baz i użytkowników?
- czy runtime API używa pooled URL, a migracje/direct admin używają direct URL?
- czy nazwy zmiennych środowiskowych odróżniają `DATABASE_URL_POOLED` od `DATABASE_URL_DIRECT`?
- czy wybrany `pool_mode` jest opisany dla danej usługi?
- czy aplikacja przez transaction pooling nie używa session-level features?
- czy prepared statements zostały przetestowane przez PgBouncer pod równoległym ruchem?
- czy `max_prepared_statements` jest ustawione świadomie, jeśli prepared statements są używane z transaction pooling?
- czy framework/driver nie wymaga wyłączenia prepared statements albo session pooling?
- czy migracje ORM nie idą przez PgBouncer transaction pooling?
- czy kod nie polega na sesyjnym `SET search_path`, `SET role`, `SET app.tenant_id`?
- czy tenant context używa `SET LOCAL` wewnątrz transakcji albo jawnych filtrów?
- czy `LISTEN/NOTIFY`, temp tables, session advisory locks i długie cursory omijają transaction pooling?
- czy PgBouncer ma monitoring `SHOW POOLS`, `SHOW STATS`, `SHOW CLIENTS`, `SHOW SERVERS`?
- czy alerty obejmują `cl_waiting`, `maxwait`, `avg_wait_time`, brak `sv_idle` i błędy poolera?
- czy runbook opisuje `PAUSE`, `RESUME`, `RECONNECT`, `RELOAD` i zachowanie przy failoverze?

### Migracje

- czy migracja działa na pustej bazie?
- czy migracja działa na kopii produkcji?
- czy jest kompatybilna z rolling deploy?
- czy ma ocenę locków?
- czy ma ocenę WAL i miejsca na dysku?
- czy backfill jest batchowany?
- czy można go wznowić?
- czy po migracji jest `ANALYZE`?
- czy rollback/roll-forward jest opisany?

### Bezpieczeństwo

- czy aplikacja nie używa superusera?
- czy rola runtime ma minimalne uprawnienia?
- czy `pg_hba.conf` ogranicza hosty i metody auth?
- czy TLS jest wymagany przez sieć?
- czy sekrety nie są w repo?
- czy RLS działa dla tabel tenantowych?
- czy logi nie zawierają danych wrażliwych?
- czy restore na test maskuje dane?
- czy extensions są zatwierdzone?

### Operacje

- czy backup obejmuje tę zmianę?
- czy restore był testowany?
- czy monitoring obejmuje nową tabelę/job/replikację?
- czy alerty obejmują lag, WAL, dysk, backup i błędy?
- czy runbook został zaktualizowany?
- czy zmiana wpływa na repliki?
- czy zmiana wpływa na PgBouncer?
- czy zmiana wpływa na upgrade major version?
