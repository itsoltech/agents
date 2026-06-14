# mongodb-review Reference Sector: Projektowanie modelu danych

## Zawartość

- Projektowanie modelu danych
- Embedding vs references
- Rozmiar dokumentu i zagnieżdżenia
- Nazewnictwo i konwencje schematu
- Multi-tenancy
- Schema validation
- Schema versioning i migracje danych

## Projektowanie modelu danych

MongoDB ma elastyczny model dokumentowy. Dokumenty w jednej kolekcji mogą mieć różne pola i typy pól, ale produkcyjna aplikacja powinna mieć jawne reguły schematu. Brak reguł prowadzi do dryfu danych, trudnych migracji i zapytań pełnych wyjątków.

Przy projektowaniu kolekcji opisz:

- nazwę kolekcji
- właściciela domenowego
- przykładowy dokument
- pola wymagane i opcjonalne
- pola indeksowane
- pola immutable
- access patterns
- expected cardinality
- expected growth rate
- retencję
- archiwizację
- zasady soft delete
- zasady migracji schematu
- zależności od innych kolekcji
- wymagany write concern
- wymagany read concern/read preference

Przykładowy opis kolekcji:

```md
## Embedding vs references

Embedding stosuj, gdy dane są naturalną częścią jednego agregatu i są zwykle odczytywane razem. References stosuj, gdy dane mają niezależny lifecycle, rosną bez limitu, są współdzielone przez wiele agregatów albo są odczytywane niezależnie.

Embedding jest dobry dla:

- adresu w zamówieniu
- snapshotu danych klienta w momencie transakcji
- kilku pozycji w małej liście
- ustawień użytkownika
- statusów i metadanych jednego procesu
- danych, które mają być atomowo aktualizowane razem z dokumentem nadrzędnym

References są lepsze dla:

- dużych list rosnących bez limitu
- komentarzy, logów, eventów, audytów
- relacji many-to-many
- danych współdzielonych między agregatami
- danych z inną retencją
- danych, które są często aktualizowane niezależnie
- danych, które mogą przekroczyć limit dokumentu

Nie osadzaj tablicy, która może rosnąć bez limitu. Typowy problem to `user.notifications`, `project.events`, `order.logs`, `conversation.messages`. Takie dane powinny zwykle trafić do osobnej kolekcji z indeksem po `tenantId`, `parentId`, `createdAt` i retencją.
## Rozmiar dokumentu i zagnieżdżenia

MongoDB ma maksymalny rozmiar dokumentu BSON równy 16 MiB. Ten limit chroni RAM i bandwidth, ale dla aplikacji produkcyjnej dokumenty powinny być dużo mniejsze. Dokument o rozmiarze kilku megabajtów zwykle jest sygnałem złego modelu danych, problemów z update, problemów z change streams i wysokiego kosztu transferu między aplikacją a bazą.

Zasady:

- nie projektuj dokumentów, które mogą regularnie rosnąć do wielu megabajtów
- nie przechowuj dużych plików binarnych w zwykłych dokumentach
- dla dużych plików użyj object storage albo GridFS, jeśli masz konkretny powód
- nie zapisuj pełnych payloadów API, HTML, PDF albo obrazów w głównej kolekcji operacyjnej
- dla logów i eventów używaj osobnych kolekcji z retencją
- dla snapshotów trzymaj tylko pola potrzebne aplikacji
- monitoruj średni i maksymalny rozmiar dokumentów w krytycznych kolekcjach
- uważaj na update całego dużego dokumentu, bo zwiększa koszt I/O i może generować duże eventy w change streams
## Nazewnictwo i konwencje schematu

- używaj jednej konwencji nazw pól w całym projekcie, np. `camelCase`
- nie mieszaj `snake_case`, `camelCase` i `PascalCase` w jednej bazie
- używaj jawnych pól `createdAt`, `updatedAt`, `deletedAt`, `schemaVersion`, jeśli są potrzebne
- timestampy trzymaj jako `Date`, nie jako string
- pieniądze trzymaj jako integer w najmniejszej jednostce albo Decimal128, nie jako float
- enumy trzymaj jako stabilne stringi albo liczby z mapowaniem, ale nie mieszaj obu wariantów
- ID tenantów, użytkowników i agregatów trzymaj w spójnych typach
- nie zmieniaj typu pola między dokumentami bez migracji
- unikaj pól o bardzo ogólnych nazwach typu `data`, `payload`, `meta`, jeśli aplikacja musi po nich filtrować
- nie indeksuj głębokich dynamicznych pól, jeśli nie znasz access pattern
- dla danych dynamicznych rozważ osobny obszar dokumentu, np. `customFields`, oraz ograniczony zestaw indeksów
## Multi-tenancy

W aplikacjach multi-tenant decyzja o modelu tenantów wpływa na indeksy, bezpieczeństwo, backupy, eksport danych, retencję i możliwość shardingu.

Najczęstszy model to jedna baza i wspólne kolekcje z polem `tenantId`. Wtedy `tenantId` powinien być pierwszym polem w większości indeksów operacyjnych, szczególnie dla list i lookupów. Każde zapytanie z warstwy aplikacji musi automatycznie zawierać filtr tenantowy, chyba że jest to operacja administracyjna wykonana przez jawnie oznaczony komponent.

Alternatywy:

- osobna baza per tenant
- osobna kolekcja per tenant
- osobny cluster per duży tenant
- wspólna kolekcja z `tenantId` i zone sharding dla dużych tenantów

Zasady:

- nie pozwalaj pisać zapytań bez `tenantId` w zwykłym kodzie aplikacji
- nie opieraj izolacji tenantów wyłącznie na frontendzie
- testuj każdy endpoint pod kątem cross-tenant access
- dodaj helpery/repository, które automatycznie doklejają filtr tenantowy
- indeksy list powinny zwykle zaczynać się od `tenantId`
- unikalność zwykle powinna być scoped per tenant, np. `{ tenantId: 1, slug: 1 } unique`
- nie rób globalnego unique index na `email`, jeśli ten sam email może istnieć w różnych tenantach
- backup/restore per tenant wymaga wcześniejszego zaprojektowania eksportu i importu danych
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
