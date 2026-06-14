# mongodb-review Reference Sector: Aplikacyjny repository/data access layer

## Zawartość

- Aplikacyjny repository/data access layer
- Komunikacja API i persistence
- Testowanie aplikacji z MongoDB
- Scenariusze QA i edge case'y
- Antywzorce

## Aplikacyjny repository/data access layer

Warstwa dostępu do MongoDB powinna chronić aplikację przed losowymi zapytaniami i powtarzaniem filtrów bezpieczeństwa.

Zasady:

- repository powinno automatycznie stosować `tenantId`, jeśli aplikacja jest multi-tenant
- repository powinno zawierać tylko zapytania obsługiwane przez znane indeksy
- nie pozwalaj handlerom HTTP budować dowolnych query objectów bez walidacji
- filtrowanie i sortowanie od klienta musi mieć whitelistę pól
- mapuj dokumenty MongoDB na typy domenowe/DTO
- nie przekazuj surowego dokumentu z bazy bezpośrednio do publicznego API, jeśli zawiera pola techniczne albo wrażliwe
- obsługuj duplicate key jako typowany błąd domenowy
- obsługuj write conflict/version conflict osobno od `not found`
- nie ukrywaj timeoutów bazy jako pustych list

Przykład whitelisty sortowania:

```typescript
const allowedSortFields = new Set(["createdAt", "updatedAt", "name"]);

if (!allowedSortFields.has(input.sortBy)) {
  throw new BadRequestError("Unsupported sort field");
}
```
## Komunikacja API i persistence

API nie powinno ujawniać szczegółów MongoDB. Klient frontendowy nie powinien wiedzieć, czy dane są zapisane w MongoDB, Postgresie czy innym storage.

Zasady:

- nie wysyłaj `_id` jako jedynego identyfikatora publicznego, jeśli domena ma własne ID
- nie ujawniaj nazw kolekcji i pól technicznych w API
- nie pozwalaj klientowi przekazywać surowego query MongoDB
- nie implementuj endpointów typu `/find` przyjmujących dowolny filtr od klienta
- filtry API mapuj na bezpieczne, znane query patterns
- paginacja API powinna być zgodna z indeksami
- błędy bazy mapuj na stabilne błędy API
- duplicate key mapuj na conflict, nie internal server error
- timeout bazy powinien być widoczny w logach i metrykach
## Testowanie aplikacji z MongoDB

Testy powinny pokrywać nie tylko happy path, ale też zachowanie bazy pod obciążeniem, migracje, indeksy i edge case'y danych.

Rodzaje testów:

- unit tests dla mapowania dokumentów i reguł domenowych
- integration tests z prawdziwym MongoDB
- migration tests na kopii starych dokumentów
- repository tests dla wszystkich query patterns
- performance tests dla krytycznych zapytań
- failover tests dla replica set
- backup/restore tests
- security tests dla tenant isolation
- QA tests dla danych nietypowych i częściowo uszkodzonych

Zasady:

- testy integracyjne powinny używać prawdziwego MongoDB, nie tylko mocka
- każdy query pattern powinien mieć test danych brzegowych
- testuj brak pola, null, zły typ, pustą tablicę, dużą tablicę, duży dokument
- testuj duplicate key i konflikty wersji
- testuj migrację dokumentów ze starszych wersji schematu
- testuj endpointy multi-tenant próbą dostępu do danych innego tenanta
- testuj zachowanie aplikacji po timeoutach i retry
- testuj paginację przy takich samych timestampach
- testuj sortowanie przy brakujących polach
## Scenariusze QA i edge case'y

Dla każdej nowej funkcji korzystającej z MongoDB przygotuj scenariusze:

### Dane i schemat

- dokument bez opcjonalnego pola
- dokument z polem `null`
- dokument ze starym `schemaVersion`
- dokument z dodatkowym nieznanym polem
- dokument z pustą tablicą
- dokument z bardzo dużą tablicą
- dokument blisko limitu rozmiaru
- dokument z błędnym typem pola z legacy danych

### Indeksy i zapytania

- filtr bez wyników
- filtr z bardzo dużą liczbą wyników
- sortowanie po polu z duplikatami
- paginacja po ostatnim elemencie strony
- jednoczesne dodanie/usunięcie elementu między stronami paginacji
- brak indeksu na staging i reakcja aplikacji
- query z `COLLSCAN` wykryte przez profiler

### Współbieżność

- dwa requesty aktualizujące ten sam dokument
- retry po timeout, gdy zapis mógł się udać
- duplicate webhook/event
- worker przerwany w połowie batcha
- migracja uruchomiona drugi raz
- update z nieaktualną wersją dokumentu

### Multi-node

- restart primary podczas zapisu
- odczyt z secondary tuż po zapisie
- replication lag podczas importu
- change stream po reconnect
- resume token poza oplog window
- utrata jednego noda replica set

### Bezpieczeństwo

- próba dostępu do dokumentu innego tenanta
- próba sortowania po niedozwolonym polu
- próba przekazania operatora MongoDB w filtrze API, np. `$ne`, `$where`, `$regex`
- bardzo duży payload JSON
- payload z polami technicznymi, np. `tenantId`, `role`, `schemaVersion`
- endpoint admina użyty przez zwykłego użytkownika
## Antywzorce

- jedna kolekcja `data` na wszystko
- jeden wielki dokument per tenant
- tablica eventów/logów rosnąca bez limitu w dokumencie głównym
- zapytania bez `tenantId` w aplikacji multi-tenant
- endpoint przyjmujący dowolny filtr MongoDB od klienta
- dodawanie indeksu po każdym polu, które pojawia się w filtrze
- brak limitu na listach
- paginacja przez głęboki `skip` na dużych kolekcjach
- przechowywanie plików w zwykłych dokumentach
- brak backup restore test
- aplikacja używa konta admina do zwykłych operacji
- connection client tworzony per request
- sharding bez analizy shard key
- transakcje używane do każdej operacji, bo model danych jest zbyt relacyjny
- brak obsługi duplicate key
- brak planu migracji schematu
- ręczne zmiany danych produkcyjnych bez skryptu, review i backupu
