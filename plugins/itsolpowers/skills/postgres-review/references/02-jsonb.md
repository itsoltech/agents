# postgres-review Reference Sector: JSONB

## Zawartość

- JSONB
- Partycjonowanie
- Indeksy
- Zapytania
- EXPLAIN i analiza planów

## JSONB

- używaj `jsonb` dla danych o zmiennym kształcie, integracji z zewnętrznym API, audytu albo konfiguracji
- nie używaj `jsonb` dla pól, po których często filtrujesz, sortujesz, joinujesz albo walidujesz constraints
- pola używane w WHERE/JOIN/ORDER BY powinny zwykle być normalnymi kolumnami albo generated columns
- GIN index na całym `jsonb` ma sens dla containment queries typu `@>`
- expression index ma sens, gdy często odpytujesz konkretną ścieżkę w JSON
- partial index ma sens, gdy odpytujesz tylko wybrany podzbiór dokumentów
- nie dodawaj GIN index na duże, często aktualizowane kolumny JSONB bez benchmarku zapisu
- waliduj strukturę JSON w aplikacji albo przez check constraints/funkcje, jeśli dane mają kontrakt
- nie loguj całych dokumentów JSON z danymi wrażliwymi
- przy ewolucji JSONB trzymaj `schema_version` albo wersjonuj strukturę na poziomie typu zdarzenia
- przy dużej analityce JSONB rozważ ETL do tabel relacyjnych albo magazynu analitycznego

Przykłady:

```sql
CREATE INDEX order_payload_gin_idx
ON orders USING gin (payload jsonb_path_ops);

CREATE INDEX order_payload_status_idx
ON orders ((payload->>'status'));

CREATE INDEX order_payload_active_status_idx
ON orders ((payload->>'status'))
WHERE deleted_at IS NULL;
```
## Partycjonowanie

- partycjonuj dopiero wtedy, gdy istnieje konkretny problem: rozmiar tabeli, retencja, archiwizacja, maintenance, pruning, bardzo duże indeksy
- nie partycjonuj małych tabel
- wybierz partition key zgodny z najczęstszymi filtrami zapytań
- partycjonowanie po czasie jest dobre dla logów, eventów, metryk, historii i danych z retencją
- partycjonowanie po tenantach ma sens tylko przy dużych tenantach albo wymaganiach operacyjnych
- zapytania muszą filtrować po partition key, inaczej planner może dotykać wielu partycji
- unikaj tysięcy małych partycji bez testów planowania i maintenance
- twórz partycje z wyprzedzeniem
- usuwanie starych danych przez `DROP PARTITION` jest zwykle szybsze i czystsze niż masowy `DELETE`
- indeksy na partycjach trzeba projektować tak samo świadomie jak na zwykłych tabelach
- constraints i unique indexes na tabelach partycjonowanych mają ograniczenia zależne od partition key
- migracje partycjonowania testuj na kopii produkcyjnych danych
- monitoruj, czy partition pruning działa w planach `EXPLAIN`

Przykładowy model retencji:

```sql
CREATE TABLE audit_event (
    id bigint generated always as identity,
    tenant_id uuid not null,
    created_at timestamptz not null,
    event_type text not null,
    payload jsonb not null
) PARTITION BY RANGE (created_at);
```
## Indeksy

- indeksuj pod konkretne zapytania, a nie pod każdą kolumnę
- każdy indeks powinien mieć właściciela i uzasadnienie
- po dodaniu indeksu sprawdź plan zapytania i wpływ na zapis
- usuwaj indeksy nieużywane, ale dopiero po analizie pełnego cyklu ruchu
- dla equality + sort projektuj compound index w kolejności zgodnej z filtrowaniem i sortowaniem
- dla `WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC` rozważ indeks `(tenant_id, status, created_at DESC)`
- dla zapytań z warunkiem na aktywne rekordy używaj partial indexes
- dla case-insensitive lookup używaj `citext`, generated column albo expression index na `lower(email)`
- dla wyszukiwania tekstowego używaj full-text search albo `pg_trgm`, nie `ILIKE '%term%'` bez indeksu
- dla dużych tabel append-only z naturalnym porządkiem fizycznym rozważ BRIN
- dla arrays, JSONB i full-text search rozważ GIN
- nie twórz GIN bez świadomości kosztu update i rozmiaru indeksu
- przy tworzeniu indeksu na produkcyjnej tabeli używaj `CREATE INDEX CONCURRENTLY`, jeśli chcesz ograniczyć blokowanie zapisów
- `CREATE INDEX CONCURRENTLY` nie może być uruchamiany w zwykłej transakcji migracyjnej
- przy przebudowie indeksu na produkcji preferuj `REINDEX CONCURRENTLY`, jeśli wersja i przypadek użycia pozwalają
- po dużych zmianach danych sprawdź `ANALYZE`
- nie zakładaj, że index-only scan zadziała zawsze; zależy między innymi od visibility map i kolumn w indeksie
- nie trzymaj indeksów, które tylko spowalniają zapis i nigdy nie są używane

Przykłady:

```sql
CREATE INDEX CONCURRENTLY order_tenant_status_created_idx
ON orders (tenant_id, status, created_at DESC);

CREATE UNIQUE INDEX CONCURRENTLY user_email_active_unique_idx
ON app_user (tenant_id, lower(email))
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY audit_event_created_brin_idx
ON audit_event USING brin (created_at);
```
## Zapytania

- pisz zapytania pod konkretne access patterns
- zawsze sprawdzaj `EXPLAIN (ANALYZE, BUFFERS)` dla wolnych zapytań
- nie uruchamiaj `EXPLAIN ANALYZE` na mutujących zapytaniach produkcyjnych bez transakcji testowej i świadomości skutków
- sprawdzaj różnicę między estimated rows i actual rows
- duże rozbieżności często oznaczają nieaktualne statystyki, zły typ danych, korelację kolumn albo brak extended statistics
- unikaj `SELECT *` w kodzie aplikacyjnym
- wybieraj tylko potrzebne kolumny
- unikaj paginacji przez duży `OFFSET` na dużych tabelach
- dla dużych list używaj keyset pagination
- unikaj N+1 queries; pobieraj batchami albo joinami
- nie buduj dynamicznego SQL przez konkatenację wartości użytkownika
- zawsze używaj bind parameters
- dla batch insertów używaj multi-row insert, `COPY` albo mechanizmów bulk drivera
- dla upsertów używaj `INSERT ... ON CONFLICT`
- dla masowych update/delete rób batchowanie, żeby nie trzymać ogromnych transakcji
- unikaj funkcji na kolumnie w WHERE, jeśli przez to indeks nie może być użyty
- jeśli musisz używać funkcji, rozważ expression index
- unikaj implicit casts, które psują użycie indeksu
- sortowanie dużych wyników bez indeksu może generować temporary files
- monitoruj `temp_files` i `temp_bytes`
- nie zakładaj, że CTE zawsze działa jak optimization fence; zachowanie zależy od wersji i konstrukcji zapytania
- materializuj pośredni wynik świadomie, gdy ma to sens

Keyset pagination:

```sql
SELECT id, created_at, status
FROM orders
WHERE tenant_id = $1
  AND (created_at, id) < ($2, $3)
ORDER BY created_at DESC, id DESC
LIMIT 50;
```

Upsert:

```sql
INSERT INTO external_mapping (tenant_id, provider, external_id, local_id)
VALUES ($1, $2, $3, $4)
ON CONFLICT (tenant_id, provider, external_id)
DO UPDATE SET local_id = EXCLUDED.local_id, updated_at = now();
```
## EXPLAIN i analiza planów

- `EXPLAIN` pokazuje plan szacowany
- `EXPLAIN ANALYZE` wykonuje zapytanie i pokazuje realne czasy oraz liczby wierszy
- `BUFFERS` pokazuje odczyty z cache i dysku
- `WAL` pomaga ocenić koszt zapisu dla operacji mutujących
- `SETTINGS` pomaga zobaczyć parametry wpływające na plan
- używaj formatu JSON, gdy plan analizuje narzędzie
- zwracaj uwagę na:
  - sequential scan na dużej tabeli
  - nested loop na dużych zbiorach
  - sort spilling to disk
  - hash spilling to disk
  - duże różnice estimated vs actual rows
  - filtry usuwające większość wierszy po skanie
  - zbyt szerokie wiersze
  - zbyt późne ograniczenie `LIMIT`
  - brak partition pruning
- nie wymuszaj planów przez wyłączanie planner settings na produkcji
- popraw dane, indeksy, statystyki albo zapytanie zamiast walczyć z plannerem
- po zmianie indeksu porównaj plan przed i po
- po upgrade PostgreSQL porównaj plany najważniejszych zapytań

Przykład:

```sql
EXPLAIN (ANALYZE, BUFFERS, WAL, SETTINGS)
SELECT *
FROM orders
WHERE tenant_id = '00000000-0000-0000-0000-000000000000'
  AND status = 'open'
ORDER BY created_at DESC
LIMIT 50;
```
