# mongodb-data-modeling Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `mongodb-database-operations-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

MongoDB data modeling

## Przeniesione sekcje

- Cel dokumentu
- Zasady ogólne
- Kiedy MongoDB pasuje do problemu
- Granice odpowiedzialności bazy i aplikacji
- Projektowanie modelu danych
- Collection: orders
- Embedding vs references
- Rozmiar dokumentu i zagnieżdżenia
- Nazewnictwo i konwencje schematu
- Multi-tenancy
- Schema validation
- Schema versioning i migracje danych
- Indeksy
- Query optimization
- Paginacja
- Aggregation pipeline
- Update, upsert i atomicity
- Transakcje
- Idempotencja i retry
- Dane tymczasowe, TTL i retencja
- Time series collections
- Change streams
- Outbox pattern
- Read concern, write concern i read preference
- Soft delete i lifecycle danych
- Audyt i historia zmian
- Dane wrażliwe i prywatność
- Aplikacyjny repository/data access layer
- Komunikacja API i persistence
- Testowanie aplikacji z MongoDB
- Scenariusze QA i edge case'y
- Antywzorce
- Minimalny standard dla nowej kolekcji
- Example document
- Access patterns
- Indexes
- Write/read concerns
- Migration plan
- Backup/restore notes
- Security notes

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (190 linii) - Overview; Cel dokumentu; Zasady ogólne; Kiedy MongoDB pasuje do problemu; +6 więcej
- `02-schema-validation.md` (144 linii) - Schema validation; Schema versioning i migracje danych; Indeksy
- `03-query-optimization.md` (177 linii) - Query optimization; Paginacja; Aggregation pipeline; Update, upsert i atomicity; +1 więcej
- `04-idempotencja-i-retry.md` (171 linii) - Idempotencja i retry; Dane tymczasowe, TTL i retencja; Time series collections; Change streams; +3 więcej
- `05-audyt-i-historia-zmian.md` (192 linii) - Audyt i historia zmian; Dane wrażliwe i prywatność; Aplikacyjny repository/data access layer; Komunikacja API i persistence; +3 więcej
- `06-minimalny-standard-dla-nowej-kolekcji.md` (51 linii) - Minimalny standard dla nowej kolekcji
