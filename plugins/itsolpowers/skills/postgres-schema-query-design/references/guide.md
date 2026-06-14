# postgres-schema-query-design Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `postgresql-database-operations-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

PostgreSQL schema and query design

## Przeniesione sekcje

- Cel dokumentu
- Zasady ogólne
- Warstwy odpowiedzialności
- Modelowanie danych
- Identyfikatory
- Constraints i integralność danych
- Multi-tenant
- Row-level security
- JSONB
- Partycjonowanie
- Indeksy
- Zapytania
- EXPLAIN i analiza planów
- Statystyki plannerowe
- Transakcje
- Blokady i współbieżność
- Persistence aplikacji
- Liczba połączeń i capacity planning
- Connection pooling
- PgBouncer vs direct connection
- PgBouncer i prepared statements
- PgBouncer i search_path
- Migracje schematu
- Migracje danych
- Bezpieczeństwo
- Schematy i uprawnienia
- Testy i QA
- Scenariusze testowe dla edge case'ów
- Procedury operacyjne
- Minimalny zestaw ustawień dla aplikacji

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (180 linii) - Overview; Cel dokumentu; Zasady ogólne; Warstwy odpowiedzialności; +5 więcej
- `02-jsonb.md` (176 linii) - JSONB; Partycjonowanie; Indeksy; Zapytania; +1 więcej
- `03-statystyki-plannerowe.md` (174 linii) - Statystyki plannerowe; Transakcje; Blokady i współbieżność; Persistence aplikacji; +1 więcej
- `04-connection-pooling.md` (185 linii) - Connection pooling; PgBouncer vs direct connection; PgBouncer i prepared statements; PgBouncer i search_path; +1 więcej
- `05-migracje-danych.md` (165 linii) - Migracje danych; Bezpieczeństwo; Schematy i uprawnienia; Testy i QA; +1 więcej
- `06-procedury-operacyjne.md` (98 linii) - Procedury operacyjne; Minimalny zestaw ustawień dla aplikacji
