# mongodb-review Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `mongodb-database-operations-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

MongoDB review

## Przeniesione sekcje

- Cel dokumentu
- Zasady ogólne
- Kiedy MongoDB pasuje do problemu
- Granice odpowiedzialności bazy i aplikacji
- Projektowanie modelu danych
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
- Change streams
- Outbox pattern
- Connection pooling i konfiguracja drivera
- Read concern, write concern i read preference
- Replica set
- Sharding
- Backup i restore
- Bezpieczeństwo
- Sekrety i connection stringi
- Observability i monitoring
- Index builds i zmiany indeksów
- Importy, eksporty i bulk operations
- Soft delete i lifecycle danych
- Audyt i historia zmian
- Dane wrażliwe i prywatność
- Aplikacyjny repository/data access layer
- Komunikacja API i persistence
- Testowanie aplikacji z MongoDB
- Scenariusze QA i edge case'y
- Antywzorce
- Checklist do code review
- Minimalny standard dla nowej kolekcji

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (65 linii) - Overview; Cel dokumentu; Zasady ogólne; Kiedy MongoDB pasuje do problemu; +1 więcej
- `02-projektowanie-modelu-danych.md` (183 linii) - Projektowanie modelu danych; Embedding vs references; Rozmiar dokumentu i zagnieżdżenia; Nazewnictwo i konwencje schematu; +3 więcej
- `03-indeksy.md` (161 linii) - Indeksy; Query optimization; Paginacja
- `04-aggregation-pipeline.md` (187 linii) - Aggregation pipeline; Update, upsert i atomicity; Transakcje; Idempotencja i retry; +3 więcej
- `05-connection-pooling-i-konfiguracja-drivera.md` (184 linii) - Connection pooling i konfiguracja drivera; Read concern, write concern i read preference; Replica set; Sharding; +2 więcej
- `06-sekrety-i-connection-stringi.md` (175 linii) - Sekrety i connection stringi; Observability i monitoring; Index builds i zmiany indeksów; Importy, eksporty i bulk operations; +3 więcej
- `07-aplikacyjny-repository-data-access-layer.md` (147 linii) - Aplikacyjny repository/data access layer; Komunikacja API i persistence; Testowanie aplikacji z MongoDB; Scenariusze QA i edge case'y; +1 więcej
- `08-checklist-do-code-review.md` (98 linii) - Checklist do code review; Minimalny standard dla nowej kolekcji
