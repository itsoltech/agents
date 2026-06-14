# mongodb-data-modeling Reference Sector: Idempotencja i retry

## Zawartość

- Idempotencja i retry
- Dane tymczasowe, TTL i retencja
- Time series collections
- Change streams
- Outbox pattern
- Read concern, write concern i read preference
- Soft delete i lifecycle danych

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
## Soft delete i lifecycle danych

Soft delete jest użyteczny, ale łatwo powoduje błędy indeksów, unikalności i zapytań. Jeśli kolekcja używa soft delete, każde zapytanie listujące powinno świadomie filtrować `deletedAt`.

Zasady:

- używaj `deletedAt`, nie samego `isDeleted`, jeśli potrzebujesz audytu czasu usunięcia
- indeksy listujące powinny uwzględniać filtr na aktywne dokumenty albo partial index
- unikalność dla aktywnych dokumentów może wymagać partial unique index
- purge po soft delete powinien być osobnym procesem z retencją
- restore usuniętego dokumentu musi obsługiwać konflikty unikalności

Przykład unique tylko dla aktywnych dokumentów:

```javascript
db.projects.createIndex(
  { tenantId: 1, slug: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: { $exists: false } },
    name: "projects_active_slug_unique"
  }
)
```
