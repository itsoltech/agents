# mongodb-operations-debugging Reference Sector: Importy, eksporty i bulk operations

## Zawartość

- Importy, eksporty i bulk operations
- Dane tymczasowe, TTL i retencja
- Time series collections
- Change streams
- Checklist administracyjny
- Minimalny runbook incydentu MongoDB

## Importy, eksporty i bulk operations

Duże importy danych mogą wygenerować replication lag, zużyć cache, zapełnić oplog, obciążyć indeksy i spowodować timeouty aplikacji.

Zasady:

- importuj batchami
- ustaw odpowiedni write concern do klasy danych
- monitoruj replication lag podczas importu
- nie importuj bez limitów równoległości
- rozważ tymczasowe wyłączenie części indeksów tylko w kontrolowanym procesie offline
- waliduj dane przed importem
- zapisuj progress importu
- import powinien być idempotentny
- duże eksporty wykonuj z secondary, jeśli consistency i lag na to pozwalają
- eksporty powinny mieć limit czasu i limit pamięci
- nie eksportuj pełnych danych produkcyjnych do dev bez anonimizacji
## Dane tymczasowe, TTL i retencja

Nie każda kolekcja powinna rosnąć bez limitu. Dla danych tymczasowych stosuj TTL indexes albo proces archiwizacji.

TTL pasuje do:

- sesji
- tokenów resetowania hasła
- tymczasowych kodów autoryzacyjnych
- cache'y aplikacyjnych
- locków z czasem wygaśnięcia
- draftów
- krótkotrwałych eventów technicznych
- logów o ograniczonej retencji

Zasady:

- retencja powinna być opisana przy każdej kolekcji szybko rosnącej
- TTL nie powinien być jedynym mechanizmem biznesowego usuwania danych, jeśli usunięcie musi być natychmiastowe
- TTL działa asynchronicznie; nie zakładaj usunięcia dokładnie w sekundzie wygaśnięcia
- nie używaj TTL na polu, którego typ może być inny niż `Date`
- monitoruj liczbę dokumentów usuwanych przez TTL
- dla compliance i audytu rozdziel dane operacyjne od danych archiwalnych

Przykład:

```javascript
db.passwordResetTokens.createIndex(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, name: "password_reset_expiry" }
)
```
## Time series collections

Time series collections stosuj dla danych pomiarowych z timestampem, metadanymi i dużym wolumenem insertów. Nie używaj ich dla danych, które są często aktualizowane albo nie mają naturalnej osi czasu.

Zasady:

- poprawnie dobierz `timeField`
- poprawnie dobierz `metaField`, np. device, tenant, sensor, metric source
- zapisuj dane możliwie chronologicznie
- nie przechowuj zbyt wielu zmiennych pól w metadanych
- używaj indeksów na `metaField` dla filtrów equality
- używaj `timeField` dla zakresów czasu
- ustaw retencję, jeśli dane nie muszą być przechowywane bez limitu
- nie używaj time series jako ogólnego log store bez planu zapytań
- dla metryk wysokiej cardinality rozważ Prometheus/Loki/ClickHouse/OLAP zamiast MongoDB jako głównego systemu analitycznego
## Change streams

Change streams są użyteczne do event-driven architecture, synchronizacji cache, outboxów, replikacji do wyszukiwarek, websocket live events i integracji między usługami. Nie powinny zastępować jasnej logiki domenowej ani być jedynym miejscem, gdzie powstaje event biznesowy.

Zasady:

- persistuj resume token po poprawnym przetworzeniu eventu
- przy resume używaj tej samej pipeline i tych samych opcji, które wygenerowały token
- obsługuj utratę resume tokena, np. gdy oplog nie zawiera już potrzebnej pozycji
- projektuj konsumentów jako idempotentnych
- zapisuj postęp konsumenta osobno per stream/subscriber
- ogranicz payload przez `$project`, jeśli pełny dokument nie jest potrzebny
- nie włączaj pre/post images bez realnej potrzeby
- pamiętaj o limicie rozmiaru eventu change stream
- testuj reconnect, restart procesu, failover primary i opóźnionego konsumenta
- dla krytycznych eventów biznesowych rozważ transactional outbox zamiast polegania wyłącznie na change streams

Przykładowy model stanu konsumenta:

```javascript
{
  _id: "search-indexer/orders",
  streamName: "orders",
  resumeToken: { ... },
  updatedAt: ISODate("2026-06-14T10:00:00Z"),
  lastProcessedEventId: "...",
  status: "running"
}
```
## Checklist administracyjny

### Codziennie / stale przez monitoring

- primary/secondary status
- replication lag
- wolne miejsce na dysku
- slow queries
- connection count
- błędy aplikacji związane z MongoDB
- liczba timeoutów
- query latency
- backup status

### Co tydzień

- przegląd slow query logs
- przegląd największych kolekcji
- przegląd najszybciej rosnących kolekcji
- przegląd indeksów nieużywanych albo podejrzanych
- sprawdzenie oplog window
- sprawdzenie alertów i incydentów

### Co miesiąc

- test restore wybranego backupu albo przynajmniej cyklicznie według RTO/RPO
- przegląd użytkowników i ról
- przegląd retencji danych
- przegląd kosztów storage i indeksów
- przegląd wersji MongoDB i driverów
- sprawdzenie planowanych migracji danych
- sprawdzenie zgodności dokumentacji kolekcji z rzeczywistym schematem
## Minimalny runbook incydentu MongoDB

Każdy incydent powinien mieć zapis:

- czas rozpoczęcia
- objawy
- dotknięte aplikacje
- dotknięte kolekcje
- metryki w chwili incydentu
- ostatnie deploye
- ostatnie migracje
- ostatnie zmiany indeksów
- stan replica set/sharded cluster
- slow queries
- wolne miejsce na dysku
- decyzje podjęte podczas naprawy
- czas przywrócenia działania
- działania follow-up

Pierwsze kroki diagnostyczne:

```javascript
rs.status()
db.runCommand({ serverStatus: 1 })
db.currentOp()
db.adminCommand({ getLog: "global" })
```

Dodatkowo sprawdź:

- dashboard aplikacji
- logi drivera
- timeouty connection pool
- deploymenty z ostatnich godzin
- migracje i batch jobs
- backup/restore jobs
- przestrzeń dyskową
- load storage
