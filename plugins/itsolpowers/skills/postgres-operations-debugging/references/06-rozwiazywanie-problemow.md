# postgres-operations-debugging Reference Sector: Rozwiązywanie problemów

## Zawartość

- Rozwiązywanie problemów
- Upgrade'y
- Kontenery i Nomad

## Rozwiązywanie problemów

### Wolne zapytanie

Sprawdź:

- czy problem dotyczy jednego queryid czy całej bazy
- plan `EXPLAIN (ANALYZE, BUFFERS)`
- estimated vs actual rows
- czy zapytanie używa indeksu
- czy sort/hash spilluje na dysk
- czy statystyki są aktualne
- czy parametry zapytania mają nietypową selektywność
- czy doszło do zmiany planu po deployu albo po analyze
- czy wzrosła tabela, indeks albo liczba martwych wierszy
- czy storage ma wysoką latencję
- czy query czeka na lock

### Wysokie CPU

Sprawdź:

- top queries w `pg_stat_statements`
- liczbę aktywnych połączeń
- query plans
- nested loops na dużych danych
- funkcje wykonywane per row
- JSONB extraction w WHERE
- brak indeksu
- zbyt agresywne równoległe zapytania
- autovacuum i maintenance jobs
- aplikacyjne retry storm

### Wysokie RAM / OOM

Sprawdź:

- `max_connections`
- liczbę aktywnych zapytań
- `work_mem`
- sort/hash nodes w planach
- parallel workers
- maintenance operations
- connection pool per instancja
- długie transakcje
- temp files
- procesy poza PostgreSQL na tym samym hoście

### Zapełnianie dysku

Sprawdź:

- wzrost `pg_wal`
- nieaktywne replication slots
- błędy WAL archiving
- masowe update/delete
- bloat tabel i indeksów
- temp files
- logi
- backupy trzymane lokalnie
- nieusuwane stare partycje
- nieudane indeksy `CREATE INDEX CONCURRENTLY`

### Replication lag

Sprawdź:

- write rate na primary
- I/O i CPU repliki
- sieć
- długie query na hot standby
- konflikty replikacji
- replication slots
- WAL archiving
- checkpointi
- czy replika nie jest przeciążona raportami
- czy synchronous replication nie blokuje commitów

### Lock contention

Sprawdź:

- blocking pid
- typ locka
- query i transaction duration blokującego
- migracje DDL
- długie transakcje
- manualne locki
- kolejność update tabel w aplikacji
- brak indeksów na foreign key używanych przy delete/update parentów

### Autovacuum przeszkadza

Nie zatrzymuj procesu od razu. Sprawdź:

- czy to wraparound prevention
- jaką tabelę vacuumuje
- czy są długie transakcje
- ile jest dead tuples
- czy tabela ma per-table settings
- czy maintenance work memory i cost settings są sensowne
- czy problemem nie jest zbyt wiele indeksów
- czy nie ma replication slotów blokujących cleanup
## Upgrade'y

### Minor upgrade

- minor upgrade zwykle zawiera poprawki bugów i bezpieczeństwa
- czytaj release notes dla aktualnej minor wersji
- testuj upgrade na stagingu
- upewnij się, że rozszerzenia są kompatybilne
- zaplanuj restart procesu PostgreSQL
- po upgrade sprawdź logi, replikację, backupy i najważniejsze query
- nie odkładaj minor upgrade'ów bezpieczeństwa bez ryzyka zaakceptowanego przez właściciela systemu

### Major upgrade

- major upgrade wymaga planu projektu, nie tylko restartu
- wybierz metodę: `pg_dump`/restore, `pg_upgrade`, logical replication, blue/green albo migracja zarządzana przez providera
- przeczytaj release notes wszystkich wersji pośrednich
- sprawdź breaking changes, kolacje, rozszerzenia, planner, typy danych, replikację i narzędzia backupowe
- wykonaj upgrade rehearsal na kopii produkcji
- zmierz czas upgrade i analyze/reindex po upgrade
- sprawdź compatibility aplikacji, driverów, ORM, migracji i poolera
- przed upgrade zrób backup i upewnij się, że restore działa
- po major upgrade zrób nowy base backup
- po upgrade uruchom analyze albo użyj mechanizmów przeniesienia statystyk, jeśli dana wersja i metoda to obsługuje
- sprawdź query plans dla najważniejszych endpointów
- sprawdź extensions przez `ALTER EXTENSION ... UPDATE`
- zaplanuj rollback albo roll-forward
- przy blue/green zabezpiecz się przed dual writes po przełączeniu
- przy logical replication zaplanuj synchronizację schematu i cutover
- sprawdź, czy pre-upgrade backup i WAL pasują do założonego scenariusza recovery po zmianie major version

Checklist major upgrade:

```text
- lista baz i rozmiarów
- lista rozszerzeń
- lista replik i slotów
- lista aplikacji i driverów
- metoda upgrade
- czas próbnego upgrade
- wymagany downtime
- backup i restore test
- plan rollback/roll-forward
- test planów zapytań
- test migracji aplikacji
- test failover po upgrade
- nowy base backup po upgrade
```
## Kontenery i Nomad

- PostgreSQL w kontenerze wymaga trwałego wolumenu, nie ephemeral filesystem
- nie aktualizuj obrazu major version bez procedury upgrade danych
- tag obrazu musi być pinowany do wersji, nie `latest`
- konfiguracja, dane i sekrety muszą być rozdzielone
- healthcheck portu nie wystarcza; sprawdzaj gotowość bazy i rolę primary/standby
- w Nomad używaj constraints, affinities i volumes świadomie
- nie przenoś primary między nodami bez planu storage i failover
- dla single-node development Docker Compose jest OK, ale nie traktuj go jako wzorca HA
- dla produkcji self-managed rozważ systemd/bare metal/VM lub Nomad z host volumes i jasnym modelem awarii
- jeśli używasz Patroni w Nomad, consensus store i load balancer też muszą mieć HA
- backup job w Nomad powinien mieć osobny harmonogram, limity i alerty
- migracje powinny być osobnym jobem, nie ukrytym efektem startu każdej instancji aplikacji
- przy rolling deploy aplikacji upewnij się, że schemat DB jest kompatybilny z poprzednią i nową wersją aplikacji
- nie uruchamiaj wielu migratorów równolegle bez advisory lock albo mechanizmu migracyjnego
