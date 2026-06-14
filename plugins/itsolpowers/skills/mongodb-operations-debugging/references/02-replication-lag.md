# mongodb-operations-debugging Reference Sector: Replication lag

## Zawartość

- Replication lag
- Sharding
- Shard key
- Balancer, chunks i operacje sharded cluster
- Backup i restore

## Replication lag

Replication lag oznacza opóźnienie między primary a secondary. Może powodować nieświeże odczyty, problemy z failover i ryzyko utraty możliwości wznowienia change streams.

Przyczyny:

- wolny dysk na secondary
- wolna sieć między nodami
- zbyt duże batch writes
- długie operacje blokujące zasoby
- niedowymiarowany secondary
- problem z working set i cache
- zbyt mały oplog względem wolumenu zmian

Zasady:

- alertuj na replication lag
- alertuj na secondary, które przestaje nadążać
- sprawdzaj `rs.status()` i metryki replikacji
- dla dużych importów dawkuj zapisy batchami
- monitoruj oplog window
- konsumenci change streams muszą nadążać przed wygaśnięciem potrzebnych wpisów w oplogu

Przydatne komendy:

```javascript
rs.status()
rs.printReplicationInfo()
rs.printSecondaryReplicationInfo()
db.runCommand({ serverStatus: 1 }).flowControl
```
## Sharding

Sharding służy do poziomego skalowania bardzo dużych danych albo bardzo wysokiego throughputu. Nie powinien być używany jako zamiennik indeksów, dobrego modelu danych albo wystarczającego hardware.

Sharding rozważ, gdy:

- pojedynczy replica set nie mieści danych albo working set
- write throughput przekracza możliwości jednego primary
- duże kolekcje rosną szybciej niż można je obsłużyć pionowo
- potrzebujesz izolacji dużych tenantów albo regionów
- masz jasno określony shard key i access patterns

Nie shardinguj, jeśli:

- problemem jest brak indeksu
- zapytania robią pełne skany przez zły filtr
- model danych ma niekontrolowane tablice
- nie masz obserwowalności i procedur backup/restore
- nie potrafisz wskazać shard key
- większość zapytań będzie scatter-gather
## Shard key

Shard key decyduje o dystrybucji danych i routingu zapytań. Zły shard key jest trudny do naprawy i może spowodować hot shard, nierówną dystrybucję danych oraz wolne zapytania rozproszone.

Dobry shard key powinien mieć:

- wysoką cardinality
- dobrą dystrybucję wartości
- zgodność z najczęstszymi zapytaniami
- stabilność wartości
- możliwość kierowania zapytań do wybranych shardów
- brak monotonicznego wzorca, jeśli powoduje hot shard

Zasady:

- używaj `analyzeShardKey` albo równoważnej analizy przed shardingiem kolekcji
- nie wybieraj shard key tylko dlatego, że pole jest dostępne w każdym dokumencie
- nie używaj pola z małą liczbą wartości, np. `status`
- nie używaj rosnącego timestampu jako jedynego shard key dla dużego write throughputu
- hashed sharding poprawia dystrybucję, ale może utrudnić range queries
- ranged sharding wspiera range queries, ale może tworzyć hot ranges
- zone sharding stosuj do izolacji regionów, tenantów albo klas danych
- każdy krytyczny query path powinien zawierać shard key albo jego selektywny prefiks, jeśli chcesz uniknąć scatter-gather

Przykład compound shard key dla multi-tenant:

```javascript
{ tenantId: 1, orderId: "hashed" }
```

Nie traktuj tego jako uniwersalnego wzorca. Dobór shard key wymaga danych o access patterns i rozkładzie tenantów.
## Balancer, chunks i operacje sharded cluster

W sharded cluster operacje administracyjne są bardziej wrażliwe niż w replica set. Backup, migracje danych, index builds i duże importy muszą uwzględniać balancer i chunk migrations.

Zasady:

- monitoruj nierówną dystrybucję chunks i danych
- monitoruj chunk migrations
- nie uruchamiaj ciężkich migracji aplikacyjnych bez sprawdzenia balancera
- zaplanuj maintenance window dla ryzykownych operacji
- backup sharded cluster wymaga procedury zapewniającej spójność
- nie używaj bez potrzeby bezpośrednich operacji na shardach z pominięciem mongos
- aplikacja powinna łączyć się przez `mongos`, nie bezpośrednio z shardem
- testuj zapytania pod kątem targeted query vs scatter-gather
## Backup i restore

Strategia backupu musi odpowiadać na pytania:

- jakie jest RPO
- jakie jest RTO
- jak często wykonywany jest backup
- jak długo backup jest przechowywany
- czy backup jest szyfrowany
- kto ma dostęp do backupu
- gdzie backup jest przechowywany
- jak wygląda restore pełny
- jak wygląda restore wybranej bazy/kolekcji/tenanta
- kiedy ostatnio wykonano test restore

Zasady:

- dla Atlas używaj Cloud Backups i point-in-time recovery, jeśli wymagania tego potrzebują
- dla self-managed rozważ Ops Manager/Cloud Manager albo snapshoty storage z poprawną procedurą
- `mongodump` jest użyteczny, ale nie jest uniwersalną strategią backupu dla każdego klastra
- dla replica set używaj `--oplog`, jeśli potrzebujesz spójnego momentu zakończenia dumpa
- dla sharded cluster procedura backupu jest trudniejsza i wymaga zatrzymania balancera oraz kontroli zapisów, jeśli używasz dumpów/snapshotów self-managed
- backup powinien obejmować dane, indeksy, konfigurację, użytkowników, role i metadane klastra
- backup powinien być szyfrowany i przechowywany poza głównym hostem
- dostęp do backupów powinien być ograniczony i audytowany
- test restore powinien być regularny i udokumentowany
- test restore powinien mierzyć realne RTO
- po restore aplikacja powinna przejść smoke testy

Minimalna procedura restore test:

1. utwórz izolowane środowisko restore
2. przywróć backup
3. uruchom walidację kolekcji krytycznych
4. sprawdź indeksy
5. uruchom smoke testy aplikacji
6. sprawdź losową próbkę danych biznesowych
7. zmierz czas od rozpoczęcia restore do gotowości aplikacji
8. zapisz wynik testu
