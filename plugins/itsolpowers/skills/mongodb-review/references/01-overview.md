# mongodb-review Reference Sector: Overview

## Zawartość

- Overview
- Cel dokumentu
- Zasady ogólne
- Kiedy MongoDB pasuje do problemu
- Granice odpowiedzialności bazy i aplikacji


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
