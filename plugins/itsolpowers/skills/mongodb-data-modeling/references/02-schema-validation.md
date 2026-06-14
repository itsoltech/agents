# mongodb-data-modeling Reference Sector: Schema validation

## Zawartość

- Schema validation
- Schema versioning i migracje danych
- Indeksy

## Schema validation

MongoDB pozwala używać walidacji schematu, między innymi przez JSON Schema. Walidacja nie zastępuje typów aplikacyjnych ani walidacji danych wejściowych, ale chroni bazę przed uszkodzonymi dokumentami.

Stosuj schema validation dla:

- kolekcji krytycznych domenowo
- dokumentów z wymaganymi polami
- pól, których typ nie może się zmieniać
- enumów o zamkniętym zestawie wartości
- kolekcji używanych przez wiele aplikacji albo workerów
- danych importowanych z zewnętrznych źródeł

Zasady:

- walidację wprowadzaj stopniowo, szczególnie na istniejących kolekcjach
- przed zaostrzeniem reguł wykonaj audyt istniejących dokumentów
- dodawaj `schemaVersion`, jeśli format dokumentów będzie ewoluował
- nie używaj `additionalProperties: false` bez dodania `_id` do listy właściwości
- nie twórz zbyt restrykcyjnego schematu dla danych dynamicznych, jeśli jest to celowy element modelu
- walidacja powinna chronić invariants, a nie blokować każdą przyszłą zmianę produktu
- zmiany walidacji traktuj jak migrację bazy i reviewuj razem z kodem aplikacji

Przykład:

```javascript
db.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenantId", "orderId", "status", "createdAt", "updatedAt", "schemaVersion"],
      properties: {
        tenantId: { bsonType: "string" },
        orderId: { bsonType: "string" },
        status: { enum: ["draft", "confirmed", "cancelled"] },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        schemaVersion: { bsonType: "int" }
      }
    }
  }
})
```
## Schema versioning i migracje danych

MongoDB nie wymusza migracji schematu tak jak relacyjne migracje DDL, ale aplikacja nadal potrzebuje procedury migracyjnej. Bez tego powstają dokumenty w kilku formatach, a kod aplikacji zaczyna zawierać wiele warunków zgodności wstecznej.

Zasady:

- każda zmiana struktury dokumentu powinna mieć plan migracji
- dokumenty z długim lifecycle powinny mieć `schemaVersion`
- nowy kod powinien umieć czytać stary format tylko przez określony czas
- migracje powinny być idempotentne
- migracje powinny działać batchami
- migracje powinny mieć checkpoint/progress
- migracje powinny mieć możliwość wznowienia po awarii
- migracje nie powinny blokować aplikacji na długo
- migracje powinny mieć indeksy wspierające selekcję dokumentów do zmiany
- migracje powinny mieć rollback plan albo plan forward-fix
- po migracji usuń kod kompatybilności, jeśli nie jest już potrzebny

Typowy schemat migracji online:

1. dodaj nowy kod, który umie czytać stary i nowy format
2. zapisuj nowe dane już w nowym formacie
3. uruchom migrację starych danych batchami
4. monitoruj błędy i postęp migracji
5. po zakończeniu usuń fallbacki
6. zaostrz schema validation, jeśli jest potrzebna

Nie wykonuj dużych migracji przez jeden `updateMany()` bez limitu, jeśli kolekcja jest duża i system działa produkcyjnie. Preferuj batch po `_id`, `createdAt` albo innym stabilnym indeksie.
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
