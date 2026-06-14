# mongodb-review Reference Sector: Aggregation pipeline

## Zawartość

- Aggregation pipeline
- Update, upsert i atomicity
- Transakcje
- Idempotencja i retry
- Dane tymczasowe, TTL i retencja
- Change streams
- Outbox pattern

## Aggregation pipeline

Aggregation pipeline jest dobre do transformacji, raportów, lookupów i przetwarzania danych w bazie. Może też stać się źródłem wolnych zapytań, dużego użycia pamięci i trudnych awarii.

Zasady:

- zaczynaj pipeline od selektywnego `$match`
- ustawiaj `$project` wcześnie, jeśli ogranicza duże pola
- sortowanie powinno być wspierane indeksem, jeśli pipeline działa często
- `$lookup` stosuj świadomie; MongoDB nie jest relacyjnym silnikiem joinów
- `$group`, `$sort`, `$bucket`, `$setWindowFields` mogą wymagać dużej pamięci
- unikaj `$facet` na bardzo dużych zbiorach bez wcześniejszego `$match`
- unikaj pipeline bez limitu w endpointach użytkownika
- sprawdzaj limity pamięci i liczbę stage'y
- dla raportów cyklicznych rozważ materializację wyników
- dla bardzo ciężkich raportów rozważ osobny system analityczny
- używaj `allowDiskUse` świadomie; spill na dysk może chronić przed błędem, ale może też obciążyć storage

Przykładowa kolejność:

```javascript
db.orders.aggregate([
  { $match: { tenantId: "t1", createdAt: { $gte: ISODate("2026-01-01") } } },
  { $project: { status: 1, totalCents: 1, createdAt: 1 } },
  { $group: { _id: "$status", total: { $sum: "$totalCents" }, count: { $sum: 1 } } },
  { $sort: { total: -1 } }
])
```
## Update, upsert i atomicity

Pojedynczy dokument w MongoDB jest aktualizowany atomowo. Dobrze zaprojektowany agregat może dzięki temu uniknąć transakcji wielodokumentowych. Transakcje są dostępne, ale nie powinny być domyślną odpowiedzią na zły model danych.

Zasady:

- preferuj atomową aktualizację jednego dokumentu, jeśli agregat naturalnie mieści się w jednym dokumencie
- używaj operatorów `$set`, `$unset`, `$inc`, `$push`, `$addToSet`, `$pull` zamiast zastępowania całego dokumentu bez potrzeby
- przy update dodawaj warunek na oczekiwany stan, jeśli operacja jest częścią workflow
- stosuj optimistic concurrency przez `version`, `revision` albo `updatedAt`
- przy upsertach upewnij się, że filtr jest wspierany unikalnym indeksem
- nie rób upsertu po nieunikalnym filtrze
- nie aktualizuj wielu dokumentów bez limitów i telemetryki, jeśli to operacja produkcyjna
- `updateMany()` dla migracji uruchamiaj świadomie, po testach i z monitoringiem
- unikaj zapisywania tego samego dużego dokumentu w całości, jeśli zmienia się jedno pole

Przykład optimistic concurrency:

```javascript
db.orders.updateOne(
  { tenantId: "t1", orderId: "o1", revision: 7 },
  {
    $set: { status: "confirmed", updatedAt: new Date() },
    $inc: { revision: 1 }
  }
)
```

Jeśli `matchedCount = 0`, aplikacja powinna potraktować to jako konflikt wersji albo brak dostępu do dokumentu.
## Transakcje

MongoDB obsługuje transakcje wielodokumentowe w replica sets i sharded clusters. Używaj ich, gdy operacja musi atomowo zmienić kilka dokumentów lub kolekcji. Nie używaj ich jako domyślnego sposobu pisania logiki aplikacyjnej.

Transakcje są uzasadnione dla:

- przeniesienia wartości między dwoma agregatami
- utworzenia kilku dokumentów, które muszą istnieć razem
- zmiany stanu i wpisu audytowego, jeśli audyt musi być atomowy
- operacji finansowych
- migracji wymagających spójności kilku kolekcji

Zasady:

- trzymaj transakcje krótkie
- nie wykonuj zewnętrznego HTTP w trakcie transakcji
- nie czekaj na użytkownika w trakcie transakcji
- nie wykonuj długiego CPU w trakcie transakcji
- obsługuj transient errors i retry zgodnie z driverem
- ustaw read concern/write concern na poziomie transakcji, nie losowo per operacja
- testuj transakcje podczas failover primary
- nie używaj transakcji do naprawiania modelu danych, który powinien być jednym agregatem
## Idempotencja i retry

W systemach produkcyjnych trzeba zakładać retry po timeoutach, network errors, restartach workerów i failover primary. Każda operacja zapisu wywoływana z zewnątrz powinna być idempotentna albo mieć mechanizm deduplikacji.

Zasady:

- requesty tworzące zasoby powinny mieć idempotency key albo naturalny unique key
- workery powinny zapisywać status joba i próbę wykonania
- retry nie może tworzyć duplikatów dokumentów
- upsert musi opierać się na unikalnym indeksie
- webhooki i eventy zewnętrzne zapisuj z unikalnym `externalEventId`
- przy retry zapisów obsługuj duplicate key jako możliwy sukces logiczny
- nie zakładaj, że brak odpowiedzi z bazy oznacza brak zapisu

Przykład deduplikacji webhooka:

```javascript
db.webhookEvents.createIndex(
  { provider: 1, externalEventId: 1 },
  { unique: true, name: "webhook_event_unique" }
)
```
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
## Outbox pattern

Jeśli aplikacja musi niezawodnie wysłać event po zmianie stanu, użyj outbox pattern. W jednej transakcji albo atomowej operacji zapisz zmianę domenową i dokument outbox. Osobny worker publikuje event do brokera, websocket gateway, search index albo innego systemu.

Zasady:

- event outbox powinien mieć `eventId`, `aggregateId`, `tenantId`, `type`, `payload`, `createdAt`, `publishedAt`, `attempts`, `status`
- `eventId` powinien być unikalny
- worker powinien być idempotentny
- publikacja powinna mieć retry z backoffem
- poison messages powinny trafiać do osobnego statusu albo dead letter collection
- outbox powinien mieć retencję albo archiwizację
- nie usuwaj eventu natychmiast po publikacji, jeśli potrzebujesz audytu
