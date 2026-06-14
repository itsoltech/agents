# postgres-schema-query-design Reference Sector: Connection pooling

## Zawartość

- Connection pooling
- PgBouncer vs direct connection
- PgBouncer i prepared statements
- PgBouncer i search_path
- Migracje schematu

## Connection pooling

- nie otwieraj połączenia per operacja bez puli
- pool po stronie aplikacji powinien istnieć nawet przy PgBouncerze, ale jego rozmiar musi być policzony razem z PgBouncerem
- PgBouncer powinien być częścią architektury, a nie przypadkowym proxy dodanym po incydencie z połączeniami
- każdy typ ruchu powinien mieć opisany tryb połączenia: runtime API, worker, migration runner, read-only job, admin CLI, BI
- aplikacja runtime może iść przez PgBouncer transaction pooling, jeśli nie zależy od stanu sesji
- operacje zależne od stanu sesji powinny iść przez direct connection albo session pooling
- nie mieszaj direct connection i pooled connection w jednym kodzie bez jasnych nazw i konfiguracji
- connection stringi powinny mieć nazwy pokazujące intencję, np. `DATABASE_URL_POOLED`, `DATABASE_URL_DIRECT`, `DATABASE_URL_MIGRATIONS`
- ustawiaj timeout acquire connection w aplikacji
- ustawiaj `statement_timeout`, `lock_timeout` i `idle_in_transaction_session_timeout` po stronie roli albo transakcji
- monitoruj waiting clients w PgBouncerze i waiting connections w puli aplikacyjnej
- przy autoscalingu aplikacji uwzględnij chwilowy overlap starych i nowych instancji
- readonly traffic kierowany na repliki powinien mieć osobne pule, osobne limity i regułę maksymalnego laga
- nie zakładaj, że pooler rozwiąże wolne query; wolne query nadal blokuje server connection
- nie ustawiaj nieograniczonego czasu oczekiwania w kolejce poolera
- `query_wait_timeout` w PgBouncerze chroni przed niekończącą się kolejką klientów czekających na server connection
- `idle_transaction_timeout` w PgBouncerze i `idle_in_transaction_session_timeout` w PostgreSQL chronią przed sesjami wiszącymi w transakcji
## PgBouncer vs direct connection

Direct connection do PostgreSQL oznacza, że klient ma przypisany backend PostgreSQL przez cały czas trwania połączenia. Stan sesji istnieje do zamknięcia połączenia albo resetu przez driver/pool aplikacyjny. PgBouncer w trybie `transaction` zmienia tę semantykę: klient ma połączenie do PgBouncera, ale backend PostgreSQL jest wypożyczany tylko na czas transakcji.

Różnice, które trzeba uwzględnić:

- `pg_backend_pid()` może zmieniać się między transakcjami przy tym samym połączeniu klienta do PgBouncera
- prepared statements są stanem backend session, chyba że PgBouncer śledzi protocol-level named prepared statements przez `max_prepared_statements`
- SQL-level `PREPARE`, `EXECUTE`, `DEALLOCATE` nie są przepisywane przez PgBouncer tak jak protocol-level prepared statements
- `SET search_path`, `SET role`, `SET timezone`, `SET statement_timeout` wykonane poza transakcją mogą nie działać tak, jak przy direct connection
- `SET LOCAL` działa tylko do końca aktualnej transakcji i jest bezpieczniejszy w transaction pooling
- temporary tables są powiązane z sesją backendu i nie powinny być używane przez transaction pooling
- session advisory locks nie są bezpieczne przez transaction pooling; używaj transaction advisory locks albo direct/session connection
- cursory zależne od sesji i długie streamowanie wyników mogą długo trzymać server connection
- `LISTEN/NOTIFY` wymaga trwałej sesji i powinien iść direct connection albo session pooling
- logical replication, replication slots, `COPY` jako długi stream, narzędzia backupowe i migracje powinny używać direct connection albo dedykowanej konfiguracji
- DDL i introspekcja schematu powinny zwykle omijać transaction pooling
- narzędzia typu migration runner, schema diff, ORM migrate i BI powinny mieć osobny direct URL

Dobrą praktyką jest posiadanie co najmniej dwóch connection stringów:

```text
DATABASE_URL_POOLED=postgres://app:...@pgbouncer:6432/app
DATABASE_URL_DIRECT=postgres://app_migration:...@postgres:5432/app
```

W kodzie nazwy typów i konfiguracji powinny pokazywać intencję:

```text
AppDbPool       -> runtime przez PgBouncer
MigrationDbPool -> direct connection
ReportingDbPool -> read-only replica albo osobna pula
```
## PgBouncer i prepared statements

Prepared statements przy PgBouncerze są jednym z najczęstszych źródeł błędów widocznych dopiero pod ruchem produkcyjnym. W dev środowisku aplikacja często łączy się direct, a w CI ruch jest zbyt mały, żeby backend sessions były często przełączane.

Zasady:

- ustal, czy framework/driver używa prepared statements domyślnie
- ustal, czy są to protocol-level prepared statements, czy SQL-level `PREPARE` / `EXECUTE`
- dla PgBouncer transaction pooling używaj PgBouncer 1.21+ i ustaw `max_prepared_statements > 0`, jeśli chcesz korzystać z protocol-level named prepared statements
- `max_prepared_statements = 0` oznacza brak wsparcia prepared statements w transaction/statement pooling
- `max_prepared_statements` musi być większy niż liczba często używanych statementów na server connection, inaczej cache będzie rotował
- większy `max_prepared_statements` zwiększa zużycie pamięci po stronie PostgreSQL i PgBouncera
- PgBouncer śledzi i przepisuje protocol-level named prepared statements, ale nie robi tego dla SQL-level `PREPARE`, `EXECUTE`, `DEALLOCATE`
- po migracji DDL zmieniającej typy, kolumny albo shape wyniku zapytania mogą pojawić się błędy typu `cached plan must not change result type`
- po DDL wpływającym na przygotowane zapytania rozważ `RECONNECT` w PgBouncerze albo restart/recycle połączeń aplikacji
- jeżeli nie możesz zagwarantować kompatybilności drivera, użyj session pooling albo direct connection dla tej usługi
- nie rozwiązuj problemu przez globalne wyłączenie prepared statements bez benchmarku; może to pogorszyć wydajność zapytań wykonywanych często
- jeżeli wyłączasz prepared statements, zrób to jawnie w konfiguracji drivera i opisz powód

Przykłady zależne od technologii:

- Rust SQLx przygotowuje i cache'uje zapytania w API `query`, `query_as`, `query_scalar`; `PgConnectOptions::statement_cache_capacity` ma domyślną pojemność 100 statementów na połączenie
- przy SQLx + PgBouncer transaction pooling testuj realny tryb produkcyjny z równoległością, bo błędy prepared statements często nie wychodzą przy jednym połączeniu
- przy SQLx ustawienie `statement_cache_capacity(0)` ogranicza cache statementów, ale nie powinno zastępować testu zgodności konkretnej wersji SQLx, PgBouncera i providera
- w Npgsql automatyczne przygotowywanie zapytań kontrolują parametry `Max Auto Prepare` i `Auto Prepare Min Usages`; domyślnie `Max Auto Prepare` wynosi 0
- w JDBC wyłączenie server-side prepared statements dla PgBouncera wykonuje się przez `prepareThreshold=0`
- w Prisma używaj osobnego direct URL dla Prisma Migrate i pooled URL dla runtime; dla PgBouncer 1.21+ dokumentacja Prisma zaleca nie dodawać `pgbouncer=true`, a `max_prepared_statements` w PgBouncerze powinno być większe od 0
- w każdym ORM sprawdź, czy migracje, introspekcja i schema diff używają direct connection, a nie pooled transaction connection

Testy zgodności prepared statements powinny obejmować:

- równoległe requesty przez PgBouncer, nie direct PostgreSQL
- rolling deploy z dwoma wersjami aplikacji używającymi różnych shape zapytań
- migrację DDL dodającą kolumnę albo zmieniającą typ kolumny
- restart PgBouncera i reconnect aplikacji
- reconnect PostgreSQL primary po failoverze
- wyczerpanie `max_prepared_statements` przez dużą liczbę unikalnych zapytań
## PgBouncer i search_path

`search_path` określa kolejność schematów używanych przy niekwalifikowanych nazwach obiektów. Przy direct connection ustawienie sesyjne zwykle jest widoczne dla kolejnych zapytań na tym samym połączeniu. Przy PgBouncer transaction pooling nie można na tym polegać między transakcjami.

Zasady:

- nie opieraj poprawności aplikacji na `SET search_path` wykonanym raz po starcie połączenia, jeśli ruch idzie przez transaction pooling
- preferuj jawnie kwalifikowane nazwy w SQL, szczególnie w migracjach, funkcjach `SECURITY DEFINER`, triggerach, `auth_query`, maintenance scripts i integracjach
- dla aplikacji multi-tenant opartej o schema-per-tenant unikaj dynamicznego `search_path` jako jedynego mechanizmu izolacji
- jeśli musisz ustawić `search_path` per request, rób to przez `SET LOCAL search_path = ...` wewnątrz jawnej transakcji i wykonuj całą operację w tej samej transakcji
- nie wykonuj `SET search_path` poza transakcją i nie zakładaj, że kolejne query użyje tego samego backendu
- `ALTER ROLE ... SET search_path` i `ALTER DATABASE ... SET search_path` działają jako defaults dla nowej sesji backendu, ale nie rozwiązują dynamicznego per-request tenancy
- przy RLS preferuj `SET LOCAL app.tenant_id = ...` wewnątrz transakcji zamiast sesyjnego `SET app.tenant_id = ...`
- przy funkcjach `SECURITY DEFINER` zawsze ustaw bezpieczny `search_path`, np. `SET search_path = pg_catalog, app_private`
- w kodzie SQL generowanym przez aplikację nie zakładaj, że `public` jest zawsze pierwszym schematem
- nie dodawaj `search_path` do `track_extra_parameters` bez sprawdzenia wersji PgBouncera, konfiguracji auth i ryzyk bezpieczeństwa
- jeśli `track_extra_parameters` obejmuje `search_path`, `auth_query` musi używać nazw w pełni kwalifikowanych
- po aktualizacji PostgreSQL, PgBouncera albo rozszerzeń sprawdź, czy parametry raportowane do klienta nie zmieniły zachowania poolera

Bezpieczniejszy wzorzec dla tenant context:

```sql
BEGIN;
SET LOCAL app.tenant_id = '00000000-0000-0000-0000-000000000000';
SELECT * FROM app.invoice WHERE tenant_id = current_setting('app.tenant_id')::uuid;
COMMIT;
```

Bezpieczniejszy wzorzec dla jawnego schematu:

```sql
SELECT id, number, total
FROM app.invoice
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT 50;
```

Wzorzec ryzykowny przy transaction pooling:

```sql
SET search_path = tenant_123, public;
SELECT * FROM invoice;
```
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
