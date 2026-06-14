# postgres-operations-debugging Reference Sector: Patroni i automatyczny failover

## Zawartość

- Patroni i automatyczny failover
- Load balancing
- Replikacja logiczna
- Sharding i rozproszenie danych
- Vacuum, autovacuum i bloat
- ANALYZE
- Konfiguracja serwera
- Storage i system operacyjny

## Patroni i automatyczny failover

- do automatycznego HA self-managed używaj sprawdzonego managera, np. Patroni
- Patroni wymaga warstwy consensus, np. etcd, Consul albo ZooKeeper
- consensus store jest częścią systemu HA i musi mieć własny backup, monitoring i procedury awaryjne
- nie uruchamiaj failover automation bez testu split-brain
- load balancer powinien wykrywać aktualny primary przez health endpoint Patroni albo równoważny mechanizm
- rozdziel endpoint write i read
- aplikacje zapisujące muszą iść tylko do aktualnego primary
- alertuj na failover, timeline change, replication lag, degraded cluster, failed leader lock
- ustaw maksymalny dopuszczalny lag przy failover zgodnie z RPO
- testuj failover pod obciążeniem
- testuj restart pojedynczego noda, utratę sieci, utratę dysku, restart consensus store i powrót starego primary
- po failover sprawdzaj stan replik, slotów, backupów i archiwizacji WAL
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
## Replikacja logiczna

- używaj logical replication do integracji, migracji, CDC, replikacji wybranych tabel albo zero-downtime migration
- nie traktuj logical replication jako pełnego zamiennika HA
- DDL nie replikuje się tak jak DML; schemat trzeba zarządzać osobno
- publication/subscription wymaga spójnej definicji tabel po obu stronach
- replication slots logical mogą zatrzymać WAL i zapełnić dysk
- monitoruj lag subskrypcji, konflikty, sloty i błędy apply workerów
- testuj zachowanie przy update/delete bez primary key albo replica identity
- przed przełączeniem ruchu porównaj liczbę rekordów i checksums na tabelach
- przy migracjach używaj trybu dual-write tylko wtedy, gdy masz plan rozwiązywania konfliktów
- nie rób bidirectional replication bez jasnej strategii konfliktów
- po migracji usuń nieużywane sloty
## Sharding i rozproszenie danych

- nie wprowadzaj shardingu przed wyczerpaniem prostszych opcji: indeksy, partitioning, read replicas, archiwizacja, lepsze zapytania
- sharding przenosi część spójności i query planningu do aplikacji
- shard key musi wynikać z access patterns
- cross-shard joins i transakcje są kosztowne operacyjnie
- backup, restore i migracje shardów muszą mieć osobne procedury
- tenant-based sharding ułatwia izolację dużych tenantów, ale komplikuje raporty globalne
- rozważ Citus, jeśli potrzebujesz rozproszonego PostgreSQL, ale przetestuj ograniczenia pod aplikację
- `postgres_fdw` może pomóc w integracji danych, ale nie powinien maskować braku granic systemowych
- nie buduj multi-master ręcznie bez zespołu gotowego utrzymywać konflikty, recovery i spójność
## Vacuum, autovacuum i bloat

- autovacuum jest elementem normalnej pracy PostgreSQL, nie dodatkiem
- standardowy `VACUUM` odzyskuje miejsce do ponownego użycia przez tabelę
- standardowy `VACUUM` zwykle nie oddaje miejsca systemowi operacyjnemu
- `VACUUM FULL` może oddać miejsce, ale bierze exclusive lock, trwa dłużej i wymaga dodatkowego miejsca
- autovacuum nie wykonuje `VACUUM FULL`
- nie zatrzymuj autovacuum tylko dlatego, że zużywa CPU albo I/O
- jeśli autovacuum przeszkadza, dostrój progi, koszt i harmonogram, zamiast go wyłączać
- monitoruj `n_dead_tup`, `last_autovacuum`, `last_autoanalyze`, wiek XID i bloat
- duże tabele często wymagają per-table autovacuum settings
- długie transakcje, idle in transaction, replication slots i hot standby feedback mogą blokować sprzątanie martwych wierszy
- częste update dużych wierszy generują bloat i WAL
- używaj HOT updates tam, gdzie to możliwe: nie aktualizuj indeksowanych kolumn bez potrzeby
- dla tabel z masowym delete lepsza może być partycja i `DROP PARTITION`
- po dużym delete rozważ `VACUUM`, `REINDEX CONCURRENTLY`, `pg_repack` albo przebudowę partycji
- monitoruj transaction ID wraparound
- autovacuum do prevent wraparound ma pierwszeństwo i nie powinien być zabijany bez planu awaryjnego

Przykłady diagnostyczne:

```sql
SELECT
    schemaname,
    relname,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 30;

SELECT
    datname,
    age(datfrozenxid) AS xid_age
FROM pg_database
ORDER BY xid_age DESC;
```
## ANALYZE

- planner opiera się na statystykach
- `ANALYZE` zbiera statystyki zawartości tabel
- po dużych importach, backfillach i zmianach dystrybucji danych uruchom `ANALYZE`
- dla często zmieniających się dużych tabel dostrój autovacuum analyze thresholds
- przy złych planach sprawdź, kiedy było ostatnie analyze
- dla kolumn z nierównomiernym rozkładem zwiększ statistics target
- extended statistics stosuj dla kolumn zależnych od siebie
- nie rozwiązuj wszystkich problemów przez globalne zwiększenie statistics target
## Konfiguracja serwera

- zmieniaj parametry na podstawie workloadu, metryk i testów
- nie kopiuj konfiguracji z internetu bez przeliczenia pamięci i liczby połączeń
- `shared_buffers` ustawiaj z uwzględnieniem RAM i cache systemu operacyjnego
- `work_mem` jest per operacja sort/hash, nie globalnym limitem na proces
- wysokie `work_mem` przy wielu równoległych zapytaniach może doprowadzić do OOM
- `maintenance_work_mem` wpływa na operacje maintenance, np. indeksy i vacuum
- `max_connections` wpływa na pamięć i procesy; lepiej użyć poolera niż ustawiać bardzo dużą wartość
- `effective_cache_size` jest wskazówką dla plannera, nie alokacją pamięci
- `random_page_cost` i `seq_page_cost` dostrajaj do storage, ale dopiero po testach
- `checkpoint_timeout`, `max_wal_size` i checkpoint tuning wpływają na I/O i recovery time
- monitoruj checkpointi, WAL rate i archiwizację
- dla SSD/NVMe testuj ustawienia I/O na realnym workloadzie
- nie zmieniaj isolation, fsync, full_page_writes, synchronous_commit bez zrozumienia ryzyka utraty danych
- `synchronous_commit = off` może poprawić latency, ale zmienia gwarancje trwałości
- parametry produkcyjne trzymaj w repo albo IaC, nie tylko na serwerze
## Storage i system operacyjny

- PostgreSQL wymaga stabilnego storage i poprawnej semantyki fsync
- nie używaj niestabilnego storage sieciowego bez testów fsync, latency i awarii
- monitoruj IOPS, throughput, latency, queue depth i space usage
- trzymaj `pg_wal` na storage, który wytrzyma burst zapisu
- nie dopuszczaj do zapełnienia dysku, szczególnie `pg_wal`
- ustaw alerty na wolne miejsce, wzrost WAL, replication slots i backup failures
- rozdzielenie data i WAL ma sens tylko, jeśli storage rzeczywiście ma osobne zasoby
- snapshoty storage muszą być spójne z PostgreSQL albo wykonywane przez procedurę backupową
- unikaj OOM killera dla procesu PostgreSQL; lepiej ograniczyć połączenia i pamięć
- logi PostgreSQL mogą zawierać dane wrażliwe, więc uprawnienia do logów muszą być ograniczone
