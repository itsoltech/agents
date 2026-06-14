# mongodb-review Reference Sector: Indeksy

## Zawartość

- Indeksy
- Query optimization
- Paginacja

## Indeksy

Indeks projektuj pod konkretne zapytanie. Dla każdej istotnej operacji zapisz:

- filtr
- sortowanie
- projekcję
- limit
- oczekiwaną liczbę dokumentów
- indeks, który ma obsługiwać zapytanie
- wynik `explain("executionStats")`

Indeks powinien pokrywać najważniejsze zapytania, a nie każdą możliwą kombinację filtrów. Zbyt wiele indeksów spowalnia zapisy, zwiększa użycie RAM/dysku i wydłuża migracje.

Zasady:

- używaj compound indexes zgodnie z access pattern
- dla compound index stosuj zasadę ESR: equality, sort, range
- pola equality zwykle umieszczaj na początku indeksu
- pole sortowania umieszczaj przed polem range, jeśli chcesz uniknąć sortowania w pamięci
- pole range zwykle powinno być po equality i sort
- jeśli zapytanie sortuje po polu, indeks musi wspierać sortowanie
- dla list zawsze ustawiaj limit
- dla zapytań zwracających mało pól używaj projection
- covered query ma sens, gdy filtr i zwracane pola są w indeksie
- nie zakładaj, że index intersection będzie tak szybki jak dobrze dobrany compound index
- usuwaj nieużywane indeksy po analizie metryk
- nie duplikuj indeksów o tym samym prefiksie bez powodu
- dla rzadkich warunków używaj partial index
- partial index preferuj zamiast sparse index, jeśli potrzebujesz precyzyjnego warunku
- dla pól tekstowych i case-insensitive lookup zaprojektuj collation albo pole znormalizowane
- dla sortowania po wielu polach sprawdź zgodność kierunków w compound index
- nie indeksuj tablic rosnących bez limitu

Przykład indeksu pod listę:

```javascript
db.orders.createIndex(
  { tenantId: 1, status: 1, createdAt: -1 },
  { name: "orders_tenant_status_createdAt_desc" }
)
```

Przykład partial index:

```javascript
db.orders.createIndex(
  { tenantId: 1, paymentStatus: 1, updatedAt: 1 },
  {
    name: "orders_pending_payments",
    partialFilterExpression: {
      paymentStatus: { $in: ["pending", "failed"] }
    }
  }
)
```

Przykład unique per tenant:

```javascript
db.users.createIndex(
  { tenantId: 1, emailNormalized: 1 },
  { unique: true, name: "users_tenant_email_unique" }
)
```
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
