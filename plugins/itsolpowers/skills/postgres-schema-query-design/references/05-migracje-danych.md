# postgres-schema-query-design Reference Sector: Migracje danych

## Zawartość

- Migracje danych
- Bezpieczeństwo
- Schematy i uprawnienia
- Testy i QA
- Scenariusze testowe dla edge case'ów

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
## Bezpieczeństwo

- każda aplikacja powinna mieć własną rolę DB
- aplikacja nie powinna łączyć się jako superuser
- role migracyjne i role runtime powinny być osobne
- rola runtime nie powinna mieć uprawnień DDL
- używaj zasady najmniejszych uprawnień
- `pg_hba.conf` powinien dopuszczać tylko wymagane hosty, użytkowników i metody auth
- używaj SCRAM zamiast słabych metod hasłowych
- wymuszaj TLS dla połączeń przez sieć
- certyfikaty i hasła trzymaj w secret managerze, nie w repo
- rotuj hasła i certyfikaty
- ogranicz dostęp do portu PostgreSQL na poziomie sieci
- nie wystawiaj PostgreSQL publicznie bez VPN/bastion/firewall i silnej autoryzacji
- loguj połączenia i błędy auth, ale nie loguj pełnych wartości parametrów zawierających dane wrażliwe
- nie dawaj aplikacji `BYPASSRLS`
- nie dawaj aplikacji `CREATEROLE`, `CREATEDB`, `REPLICATION`, jeśli nie jest to wymagane
- używaj osobnego użytkownika replikacji z minimalnymi uprawnieniami
- audytuj role, granty, default privileges i ownership
- przy restore na niższe środowiska maskuj dane osobowe i sekrety
- extensions instaluj świadomie; extension działa w procesie bazy i ma wpływ na bezpieczeństwo oraz upgrade
- nie instaluj nieznanych rozszerzeń na produkcji bez review

Audyt ról:

```sql
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls
FROM pg_roles
ORDER BY rolname;
```
## Schematy i uprawnienia

- nie trzymaj wszystkiego w `public`, jeśli projekt ma wiele modułów albo integracji
- odbierz domyślne uprawnienia, jeśli nie chcesz przypadkowego tworzenia obiektów w `public`
- kontroluj `search_path`
- nie polegaj na niejawnych schematach w security-sensitive functions
- dla funkcji `SECURITY DEFINER` ustaw bezpieczny `search_path`
- ownership obiektów powinien należeć do roli właściciela, nie do roli aplikacyjnej
- default privileges ustawiaj jawnie dla nowych tabel, sekwencji i funkcji
- migracje powinny tworzyć obiekty z przewidywalnym właścicielem
- nie dawaj `GRANT ALL ON SCHEMA public TO PUBLIC`
- audytuj funkcje `SECURITY DEFINER`
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
