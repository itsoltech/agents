# mongodb-review Reference Sector: Sekrety i connection stringi

## Zawartość

- Sekrety i connection stringi
- Observability i monitoring
- Index builds i zmiany indeksów
- Importy, eksporty i bulk operations
- Soft delete i lifecycle danych
- Audyt i historia zmian
- Dane wrażliwe i prywatność

## Sekrety i connection stringi

Connection string zawiera hosty, opcje drivera i często dane uwierzytelniające. Nie może trafiać do logów, repozytorium ani błędów wysyłanych do klienta.

Zasady:

- connection string trzymaj jako sekret
- oddziel sekrety dev/staging/prod
- nie kopiuj produkcyjnego connection stringa do lokalnego `.env`
- w logach maskuj użytkownika, hasło i query params związane z auth
- ustaw `appName`, żeby łatwiej diagnozować połączenia w metrykach
- przy rotacji hasła zaplanuj rollout aplikacji
- dla wielu usług używaj osobnych użytkowników i connection stringów
## Observability i monitoring

Monitoring powinien wykrywać problemy zanim użytkownicy zaczną zgłaszać błędy. MongoDB wymaga obserwacji na poziomie bazy, hosta, storage, aplikacji i drivera.

Monitoruj:

- CPU
- RAM
- WiredTiger cache
- disk I/O
- wolne miejsce na dysku
- liczba połączeń
- connection pool wait time w aplikacji
- query latency
- slow queries
- liczba dokumentów skanowanych vs zwróconych
- index usage
- lock/queue/flow control
- replication lag
- primary elections
- oplog window
- chunk migrations
- TTL deletes
- liczba błędów duplicate key
- timeouty drivera
- retry i transient errors
- rozmiar kolekcji
- rozmiar indeksów
- tempo wzrostu danych

Przydatne komendy diagnostyczne:

```javascript
db.runCommand({ serverStatus: 1 })
db.currentOp()
db.collection.stats()
db.collection.totalIndexSize()
db.collection.getIndexes()
db.collection.find(query).explain("executionStats")
rs.status()
sh.status()
```

Zasady:

- slow query logs powinny być dostępne dla zespołu utrzymującego aplikację
- każdy krytyczny endpoint powinien mieć metryki latency po stronie aplikacji
- koreluj request id z logami aplikacji i błędami MongoDB
- alerty powinny mieć runbook
- nie alertuj na wszystko; alertuj na stany wymagające reakcji
- dashboard powinien pokazywać nie tylko stan teraz, ale też trend wzrostu danych
## Index builds i zmiany indeksów

Zmiany indeksów są jednymi z najczęstszych operacji utrzymaniowych. Mogą poprawić wydajność odczytu, ale mogą też zwiększyć load, użycie dysku i czas zapisów.

Zasady:

- indeks dodawaj razem z opisem zapytania, które obsługuje
- przed dodaniem sprawdź istniejące indeksy i ich prefiksy
- dla dużych kolekcji sprawdź wolne miejsce na dysku
- indeks buduj poza godzinami szczytu, jeśli kolekcja jest duża
- monitoruj wpływ na latency zapisów
- po wdrożeniu sprawdź, czy query planner używa indeksu
- usuwanie indeksu wykonuj po sprawdzeniu użycia indeksu i query logs
- nie usuwaj indeksów krytycznych dla unikalności biznesowej
- indeksy unikalne traktuj jako element spójności danych, nie tylko optymalizację
## Importy, eksporty i bulk operations

Duże importy danych mogą wygenerować replication lag, zużyć cache, zapełnić oplog, obciążyć indeksy i spowodować timeouty aplikacji.

Zasady:

- importuj batchami
- ustaw odpowiedni write concern do klasy danych
- monitoruj replication lag podczas importu
- nie importuj bez limitów równoległości
- rozważ tymczasowe wyłączenie części indeksów tylko w kontrolowanym procesie offline
- waliduj dane przed importem
- zapisuj progress importu
- import powinien być idempotentny
- duże eksporty wykonuj z secondary, jeśli consistency i lag na to pozwalają
- eksporty powinny mieć limit czasu i limit pamięci
- nie eksportuj pełnych danych produkcyjnych do dev bez anonimizacji
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
## Audyt i historia zmian

Audyt nie powinien być przypadkowym logiem aplikacji. Dla danych wymagających historii zmian zaprojektuj osobną kolekcję albo outbox/event store.

Zasady:

- zapisuj kto, kiedy i co zmienił
- nie zapisuj sekretów w audycie
- payload audytu powinien mieć limit rozmiaru
- dla danych wrażliwych zapisuj diff albo metadane zamiast pełnego dokumentu
- audyt powinien być append-only
- audyt powinien mieć retencję zgodną z wymaganiami biznesowymi
- audyt powinien mieć indeksy pod zapytania administracyjne

Przykładowy dokument:

```javascript
{
  tenantId: "t1",
  actorId: "u1",
  action: "order.status.changed",
  aggregateType: "order",
  aggregateId: "o1",
  before: { status: "draft" },
  after: { status: "confirmed" },
  createdAt: ISODate("2026-06-14T10:00:00Z"),
  requestId: "req_..."
}
```
## Dane wrażliwe i prywatność

Nie każdy dokument powinien przechowywać pełne dane osobowe. Minimalizacja danych zmniejsza ryzyko wycieku, koszt backupów i trudność spełnienia wymagań prawnych.

Zasady:

- przechowuj tylko dane potrzebne aplikacji
- nie duplikuj danych osobowych w wielu kolekcjach bez potrzeby
- snapshoty danych klienta ogranicz do pól wymaganych historycznie
- tokeny i hasła zapisuj tylko jako hash albo w formie zgodnej z wymaganiami bezpieczeństwa
- dane sekretne rozważ zaszyfrować na poziomie aplikacji albo użyć mechanizmów MongoDB Enterprise/Atlas, jeśli są dostępne
- eksporty produkcyjne anonimizuj przed użyciem w dev/test
- backupy traktuj jak dane produkcyjne
- logi i audyty nie powinny zawierać pełnych dokumentów z danymi wrażliwymi
