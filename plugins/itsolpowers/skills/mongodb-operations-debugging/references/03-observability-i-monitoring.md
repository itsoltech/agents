# mongodb-operations-debugging Reference Sector: Observability i monitoring

## Zawartość

- Observability i monitoring
- Slow query workflow
- Storage, system operacyjny i self-managed deployment
- Kontenery i MongoDB
- MongoDB w Nomad / własnej infrastrukturze
- Administracja i operacje utrzymaniowe
- Index builds i zmiany indeksów

## Observability i monitoring

Monitoring powinien wykrywać problemy zanim użytkownicy zaczną zgłaszać błędy. MongoDB wymaga obserwacji na poziomie bazy, hosta, storage, aplikacji i drivera.

Monitoruj:

- CPU
- RAM
- WiredTiger cache
- disk I/O
- wolne miejsce na dysku
- liczba połączeń
- connection pool wait time w aplikacji
- query latency
- slow queries
- liczba dokumentów skanowanych vs zwróconych
- index usage
- lock/queue/flow control
- replication lag
- primary elections
- oplog window
- chunk migrations
- TTL deletes
- liczba błędów duplicate key
- timeouty drivera
- retry i transient errors
- rozmiar kolekcji
- rozmiar indeksów
- tempo wzrostu danych

Przydatne komendy diagnostyczne:

```javascript
db.runCommand({ serverStatus: 1 })
db.currentOp()
db.collection.stats()
db.collection.totalIndexSize()
db.collection.getIndexes()
db.collection.find(query).explain("executionStats")
rs.status()
sh.status()
```

Zasady:

- slow query logs powinny być dostępne dla zespołu utrzymującego aplikację
- każdy krytyczny endpoint powinien mieć metryki latency po stronie aplikacji
- koreluj request id z logami aplikacji i błędami MongoDB
- alerty powinny mieć runbook
- nie alertuj na wszystko; alertuj na stany wymagające reakcji
- dashboard powinien pokazywać nie tylko stan teraz, ale też trend wzrostu danych
## Slow query workflow

Gdy pojawia się wolne zapytanie:

1. znajdź query shape i parametry
2. uruchom `explain("executionStats")` na reprezentatywnych danych
3. sprawdź `totalDocsExamined`, `totalKeysExamined`, `nReturned`
4. sprawdź, czy jest `COLLSCAN` albo `SORT`
5. sprawdź istniejące indeksy
6. porównaj z access pattern
7. zaprojektuj indeks albo zmień zapytanie
8. sprawdź koszt nowego indeksu dla zapisów
9. przetestuj na danych podobnych do produkcji
10. wdroż indeks w kontrolowany sposób
11. sprawdź metryki po wdrożeniu
12. usuń zbędne indeksy, jeśli nowy indeks je zastępuje

Nie naprawiaj wolnych zapytań przez dodawanie losowych indeksów po jednym polu. To często zwiększa koszt zapisów i nie rozwiązuje sortowania ani selektywności.
## Storage, system operacyjny i self-managed deployment

Dla self-managed MongoDB baza jest tak stabilna jak host, storage, sieć i procedury operacyjne.

Zasady:

- używaj NTP na wszystkich hostach
- używaj XFS dla WiredTiger, jeśli masz wybór i system Linux
- ustaw poprawne `ulimit`
- monitoruj IOPS, latency dysku i queue depth
- nie przechowuj danych MongoDB na niestabilnym network storage bez pełnej świadomości konsekwencji
- wyłącz `atime` na wolumenie danych, jeśli pasuje do polityki systemu
- monitoruj wolne miejsce na dysku
- zostaw zapas miejsca na indeksy, compact/repair, temporary files i backup/snapshot
- nie uruchamiaj wielu ciężkich procesów konkurujących o RAM z MongoDB na tym samym hoście
- nie zwiększaj WiredTiger cache ponad default bez analizy
- jeśli kilka instancji MongoDB działa na jednym hoście, skonfiguruj cache świadomie
- pamiętaj, że MongoDB korzysta zarówno z WiredTiger cache, jak i filesystem cache
## Kontenery i MongoDB

Uruchamianie MongoDB w kontenerach wymaga większej dyscypliny operacyjnej niż aplikacje stateless.

Zasady:

- dane muszą być na trwałym wolumenie, nie w warstwie kontenera
- backup musi obejmować wolumen i metadane deploymentu
- zasoby CPU/RAM powinny być jawnie ustawione
- WiredTiger cache powinien być dopasowany do limitów kontenera, jeśli środowisko nie wykrywa ich poprawnie
- kontener musi mieć poprawny `ulimit`
- readiness nie powinien oznaczać tylko otwartego portu
- healthcheck powinien sprawdzać możliwość wykonania prostego polecenia
- rolling restart replica set powinien być kontrolowany
- nie restartuj wszystkich nodów naraz
- storage class/volume driver musi być dobrany pod bazę danych, nie tylko pod wygodę deploymentu
## MongoDB w Nomad / własnej infrastrukturze

Jeśli MongoDB działa w środowisku zarządzanym przez Nomad albo podobny orchestrator, traktuj ją jako workload stateful. Nie projektuj jej jak stateless service.

Zasady:

- używaj trwałych wolumenów dla `dbPath`
- przypinaj allocation do odpowiedniego noda, jeśli storage jest lokalny
- planuj node drain z uwzględnieniem replica set
- nie pozwalaj orchestratorowi restartować wielu członków replica set jednocześnie
- healthcheck powinien odróżniać proces żywy od noda gotowego do ruchu
- upgrade wykonuj rolling, z kontrolą primary/secondary
- przed maintenance upewnij się, który node jest primary
- dla backupów z lokalnych wolumenów opisz, na którym nodzie są dane
- sekrety MongoDB trzymaj w Nomad Variables/Vault, nie w job spec jako plain text
- service discovery powinno używać stabilnych nazw i portów
- aplikacje powinny używać connection stringa obejmującego replica set, nie pojedynczy allocation
## Administracja i operacje utrzymaniowe

Każda operacja administracyjna powinna mieć plan, ryzyko, okno wykonania i rollback albo forward-fix.

Operacje wymagające ostrożności:

- budowanie dużych indeksów
- usuwanie indeksów
- duże migracje danych
- zmiana schema validation
- zmiana read/write concern
- restart primary
- upgrade wersji MongoDB
- zmiana replica set config
- resharding
- backup sharded cluster
- restore produkcyjnych danych
- compact/repair
- czyszczenie dużych kolekcji

Zasady:

- przed operacją sprawdź backup
- przed operacją sprawdź replication lag
- przed operacją sprawdź wolne miejsce na dysku
- dla dużych zmian wykonaj test na staging z kopią danych
- duże operacje wykonuj batchami
- miej sposób przerwania operacji
- po operacji sprawdź metryki, slow queries i błędy aplikacji
- zapisuj historię operacji administracyjnych
## Index builds i zmiany indeksów

Zmiany indeksów są jednymi z najczęstszych operacji utrzymaniowych. Mogą poprawić wydajność odczytu, ale mogą też zwiększyć load, użycie dysku i czas zapisów.

Zasady:

- indeks dodawaj razem z opisem zapytania, które obsługuje
- przed dodaniem sprawdź istniejące indeksy i ich prefiksy
- dla dużych kolekcji sprawdź wolne miejsce na dysku
- indeks buduj poza godzinami szczytu, jeśli kolekcja jest duża
- monitoruj wpływ na latency zapisów
- po wdrożeniu sprawdź, czy query planner używa indeksu
- usuwanie indeksu wykonuj po sprawdzeniu użycia indeksu i query logs
- nie usuwaj indeksów krytycznych dla unikalności biznesowej
- indeksy unikalne traktuj jako element spójności danych, nie tylko optymalizację
