# mongodb-data-modeling Reference Sector: Overview

## Zawartość

- Overview
- Cel dokumentu
- Zasady ogólne
- Kiedy MongoDB pasuje do problemu
- Granice odpowiedzialności bazy i aplikacji
- Projektowanie modelu danych
- Embedding vs references
- Rozmiar dokumentu i zagnieżdżenia
- Nazewnictwo i konwencje schematu
- Multi-tenancy


## Cel dokumentu

Ten dokument opisuje dobre praktyki pracy z MongoDB na poziomie aplikacji, modelowania danych, zapytań, indeksów, administracji, backupów, bezpieczeństwa, multi-node i skalowania. Ma służyć jako wspólny standard dla zespołu podczas developmentu, code review, QA, planowania wdrożeń i utrzymania środowisk produkcyjnych.

Dokument jest pisany z perspektywy aplikacji, w której MongoDB jest jednym z głównych mechanizmów persistence. Nie zakłada konkretnego backendu. Te same zasady można stosować w aplikacjach pisanych w Rust, Node.js, .NET, Pythonie, Effect/TypeScript albo innych technologiach.
## Zasady ogólne

- model danych projektuj od zapytań i przypadków użycia, nie od relacyjnego ERD
- dane odczytywane razem zwykle powinny być przechowywane razem
- każda kolekcja powinna mieć opis odpowiedzialności, lifecycle danych i główne access patterns
- każdy endpoint, job, worker albo raport korzystający z MongoDB powinien mieć znany zestaw zapytań i indeksów
- każda kolekcja powinna mieć świadomą strategię wzrostu danych: retencja, archiwizacja, TTL, partycjonowanie albo sharding
- MongoDB nie zwalnia z projektowania schematu; elastyczny model danych wymaga tym bardziej jasnych reguł
- nie dodawaj indeksu bez powodu; każdy indeks przyspiesza wybrane odczyty, ale zwiększa koszt zapisów i użycie miejsca
- nie traktuj `explain()` jako narzędzia dopiero po awarii; używaj go przy projektowaniu nowych zapytań
- backup bez regularnego testu restore nie jest pełną strategią odtwarzania
- multi-node bez testu failover nie jest pełną strategią wysokiej dostępności
- decyzje dotyczące read/write concern powinny wynikać z wymagań spójności danych, a nie z domyślnych ustawień drivera
- dla danych finansowych, uprawnień, stanu jobów i operacji idempotentnych spójność jest ważniejsza niż minimalna latencja
- nie wprowadzaj sharding jako pierwszej odpowiedzi na wolne zapytania; najpierw sprawdź model danych, indeksy, working set, query plan i wzrost danych
## Kiedy MongoDB pasuje do problemu

MongoDB dobrze pasuje, gdy aplikacja operuje na dokumentach, agregatach, eventach, konfiguracjach, elastycznych strukturach danych, danych półstrukturalnych albo rekordach z naturalną strukturą zagnieżdżoną. Dobrym sygnałem jest sytuacja, w której większość odczytów dotyczy całego agregatu albo kilku pól z jednego agregatu.

MongoDB może być słabszym wyborem, gdy system wymaga wielu złożonych joinów między tabelami, silnej normalizacji, częstych transakcji obejmujących wiele niezależnych agregatów, raportowania ad hoc po dowolnych wymiarach albo gdy większość logiki opiera się na relacyjnej integralności między encjami.

Przed wyborem MongoDB odpowiedz na pytania:

- jakie są główne dokumenty/agregaty w domenie
- jakie zapytania będą wykonywane najczęściej
- które zapytania są krytyczne latency
- które dane rosną bez limitu
- które dane muszą mieć retencję
- które operacje muszą być atomowe
- które operacje mogą być eventual consistent
- czy dane będą sharded w przyszłości
- czy potrzebne są change streams
- czy potrzebne są transakcje wielodokumentowe
- czy raportowanie może być wykonywane poza główną bazą operacyjną
## Granice odpowiedzialności bazy i aplikacji

MongoDB powinno przechowywać stan aplikacji w strukturze bliskiej temu, jak aplikacja go używa. Aplikacja nadal odpowiada za reguły domenowe, walidację danych wejściowych, autoryzację, idempotencję, retry, migracje danych i obsługę błędów.

Baza powinna wymuszać reguły, które chronią spójność danych niezależnie od błędów aplikacji:

- unique indexes dla unikalnych wartości domenowych
- required fields przez schema validation tam, gdzie pole jest obowiązkowe
- typy pól przez JSON Schema tam, gdzie zmiana typu mogłaby uszkodzić aplikację
- TTL indexes dla danych tymczasowych
- constraints przez strukturę dokumentu i indeksy
- write concern dla danych wymagających trwałości
- role użytkowników i uprawnienia na poziomie bazy

Nie przenoś całej walidacji do MongoDB. Walidacja w bazie powinna chronić przed uszkodzeniem danych, ale komunikaty błędów dla użytkownika, reguły formularzy, autoryzacja i logika workflow powinny pozostać w aplikacji.
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

## Collection: orders

Owner: billing/orders
Purpose: główny agregat zamówienia
Expected growth: ~200k dokumentów miesięcznie
Retention: aktywne bez limitu, drafty usuwane po 90 dniach
Main queries:
- find by tenantId + orderId
- list by tenantId + status + createdAt desc
- find pending payment by tenantId + paymentStatus
Indexes:
- { tenantId: 1, orderId: 1 } unique
- { tenantId: 1, status: 1, createdAt: -1 }
- { tenantId: 1, paymentStatus: 1, updatedAt: 1 } partial: paymentStatus in ["pending", "failed"]
Consistency:
- writes: majority
- reads: primary for mutation flow, secondaryPreferred only for analytics
Schema version: schemaVersion
```
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
