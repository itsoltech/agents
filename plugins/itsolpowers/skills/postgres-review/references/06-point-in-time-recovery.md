# postgres-review Reference Sector: Point-in-time recovery

## Zawartość

- Point-in-time recovery
- Replikacja fizyczna i HA
- Load balancing
- Bezpieczeństwo
- Schematy i uprawnienia

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
## Load balancing

- routing write/read musi być jednoznaczny
- load balancer nie powinien wysłać zapisu do repliki
- healthcheck dla primary powinien sprawdzać rolę, nie tylko otwarty port
- healthcheck dla read replicas powinien sprawdzać lag
- connection pooler i load balancer muszą mieć zgodne timeouty
- po failover aplikacje muszą odświeżyć połączenia
- DNS TTL może opóźnić przełączenie
- długie połączenia mogą trzymać stary primary po failover
- przygotuj strategię resetowania puli po błędach typu read-only transaction albo connection terminated
- dla transakcji write nie przełączaj hosta w środku transakcji
- dla read replicas dokumentuj, które endpointy aplikacji mogą czytać dane opóźnione
- nie kieruj zapytań autoryzacyjnych lub krytycznych read-after-write na lagującą replikę
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
