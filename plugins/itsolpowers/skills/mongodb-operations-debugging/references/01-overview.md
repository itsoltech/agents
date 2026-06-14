# mongodb-operations-debugging Reference Sector: Overview

## Zawartość

- Overview
- Query optimization
- Aggregation pipeline
- Connection pooling i konfiguracja drivera
- Read concern, write concern i read preference
- Replica set


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
## Connection pooling i konfiguracja drivera

Klient MongoDB powinien być tworzony raz na proces i współdzielony przez aplikację. Tworzenie klienta per request prowadzi do nadmiaru połączeń, większej latencji i problemów z limitem connection pool.

Zasady:

- twórz `MongoClient` raz przy starcie procesu
- nie twórz klienta per request, per repository ani per job
- ustaw `serverSelectionTimeoutMS`, `connectTimeoutMS`, `socketTimeoutMS` zgodnie z wymaganiami aplikacji
- ustaw `maxPoolSize` na podstawie concurrency aplikacji i limitów klastra
- nie zwiększaj `maxPoolSize` bez sprawdzenia, czy baza i hosty to wytrzymają
- monitoruj wait time na connection pool
- przy wielu instancjach aplikacji licz łączną liczbę połączeń, nie tylko per proces
- zamykaj klienta przy graceful shutdown
- connection string powinien wskazywać replica set albo SRV record zgodnie z typem deploymentu
- nie commituj connection stringów z hasłem do repozytorium

Przykładowe parametry do świadomego ustawienia:

```text
serverSelectionTimeoutMS=5000
connectTimeoutMS=5000
socketTimeoutMS=30000
maxPoolSize=50
retryWrites=true
appName=my-service-production
```

Nie kopiuj tych wartości bez pomiaru. Są przykładem pól, które powinny być świadomie ustawione albo świadomie zostawione jako domyślne.
## Read concern, write concern i read preference

Read concern, write concern i read preference decydują o kompromisie między trwałością, spójnością, latencją i dostępnością.

Zasady:

- dla krytycznych zapisów używaj `w: "majority"`
- dla operacji, które muszą przetrwać awarię procesu, sprawdź zachowanie journalingu i `j`
- dla odczytów po zapisie w tym samym flow używaj primary albo sesji z causal consistency
- nie czytaj z secondary dla flow wymagającego najnowszych danych
- secondary reads mogą zwracać dane opóźnione względem primary
- read preference `secondaryPreferred` pasuje do raportów, eksportów i mniej krytycznych odczytów, ale nie do świeżego stanu UI po mutacji
- decyzję o read concern/write concern dokumentuj przy krytycznych kolekcjach
- nie zmieniaj globalnych ustawień concern bez testów aplikacji

Przykładowe klasy danych:

| Klasa danych | Write concern | Read preference | Uwagi |
|---|---:|---:|---|
| płatności, uprawnienia, zamówienia | majority | primary | preferuj spójność |
| cache techniczny | w:1 | primary/nearest | dopuszczalna utrata |
| raporty admina | majority albo domyślne | secondaryPreferred | akceptowalny lag |
| logi techniczne | w:1 albo majority zależnie od wymagań | secondaryPreferred | ustaw retencję |
| event outbox | majority | primary | utrata eventu może uszkodzić integrację |
## Replica set

Replica set zapewnia replikację danych i automatyczny failover. Standardem produkcyjnym powinien być replica set, nie pojedynczy standalone server.

Zasady:

- używaj minimum trzech data-bearing nodes dla produkcyjnych danych, jeśli wymagania dostępności na to pozwalają
- unikaj arbitra, jeśli możesz użyć pełnego data-bearing node
- nie używaj więcej niż jednego arbitra
- utrzymuj nieparzystą liczbę voting members, jeśli projektujesz klasyczny replica set
- używaj hostnames zamiast IP w konfiguracji replica set
- zapewnij pełną łączność sieciową między członkami replica set
- synchronizuj czas przez NTP
- monitoruj replication lag
- monitoruj stan primary/secondary
- testuj failover przed produkcją
- ustal procedurę node maintenance i rolling restart
- nie wykonuj ręcznych zmian replica set config bez planu rollback
- dokumentuj priority, votes, hidden/delayed members, jeśli ich używasz

Co testować:

- restart primary
- utrata jednego secondary
- chwilowy network partition
- opóźniony secondary
- primary election podczas dużego zapisu
- zachowanie aplikacji przy `NotPrimary`, `PrimarySteppedDown`, timeoutach i retry
- odczyt po zapisie podczas failover
