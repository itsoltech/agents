# mongodb-data-modeling Reference Sector: Query optimization

## Zawartość

- Query optimization
- Paginacja
- Aggregation pipeline
- Update, upsert i atomicity
- Transakcje

## Query optimization

Każde nowe zapytanie produkcyjne powinno być ocenione pod kątem:

- czy filtr jest selektywny
- czy używa indeksu
- czy sortowanie jest obsługiwane przez indeks
- czy projection ogranicza dane
- czy limit jest ustawiony
- ile dokumentów skanuje
- ile dokumentów zwraca
- czy używa `COLLSCAN`
- czy używa sortowania w pamięci
- czy działa dobrze przy danych 10x większych niż obecnie

Podstawowa analiza:

```javascript
db.orders.find({
  tenantId: "t1",
  status: "confirmed"
})
.sort({ createdAt: -1 })
.limit(50)
.explain("executionStats")
```

Wynik sprawdzaj pod kątem:

- `executionTimeMillis`
- `totalKeysExamined`
- `totalDocsExamined`
- `nReturned`
- `winningPlan`
- `stage`, np. `IXSCAN`, `FETCH`, `COLLSCAN`, `SORT`
- czy `totalDocsExamined` nie jest wielokrotnie większe niż `nReturned`
- czy plan nie wymaga sortowania bez indeksu

Zasady:

- unikaj zapytań bez limitu na endpointach listujących
- unikaj głębokiego `skip` dla paginacji dużych kolekcji
- preferuj keyset pagination po stabilnym polu, np. `createdAt` + `_id`
- unikaj regexów bez zakotwiczenia i bez indeksu
- nie używaj case-insensitive regex jako głównego mechanizmu wyszukiwania
- nie wyszukuj po polach dynamicznych bez indeksu i limitu
- nie pobieraj całego dokumentu, jeśli endpoint potrzebuje tylko kilku pól
- dla zapytań administracyjnych dodawaj limity i timeouty
- dla raportów ciężkich używaj osobnej ścieżki przetwarzania, agregatów materializowanych albo hurtowni danych
- testuj zapytania na danych podobnych rozmiarem do produkcji
## Paginacja

Paginacja przez `skip` jest prosta, ale przy dużych offsetach robi się kosztowna. Dla kolekcji o dużym wzroście preferuj keyset pagination.

Przykład keyset pagination:

```javascript
db.orders.find({
  tenantId: "t1",
  status: "confirmed",
  $or: [
    { createdAt: { $lt: ISODate("2026-06-01T00:00:00Z") } },
    {
      createdAt: ISODate("2026-06-01T00:00:00Z"),
      _id: { $lt: ObjectId("...") }
    }
  ]
})
.sort({ createdAt: -1, _id: -1 })
.limit(50)
```

Indeks:

```javascript
db.orders.createIndex(
  { tenantId: 1, status: 1, createdAt: -1, _id: -1 },
  { name: "orders_keyset_pagination" }
)
```

Zasady:

- sortuj po stabilnym, indeksowanym zestawie pól
- dodaj `_id` jako tie-breaker, jeśli timestamp może się powtarzać
- cursor paginacji powinien być nieprzezroczysty dla klienta
- nie pozwalaj klientowi wybierać dowolnego sortowania bez whitelisty
- dla paneli admina z dowolnymi filtrami rozważ osobny indeks/search/reporting store
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
