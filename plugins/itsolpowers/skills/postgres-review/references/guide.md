# postgres-review Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `postgresql-database-operations-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

PostgreSQL review

## Przeniesione sekcje

- Cel dokumentu
- Zasady ogólne
- Warstwy odpowiedzialności
- Modelowanie danych
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
- PgBouncer - tryby pracy
- PgBouncer vs direct connection
- PgBouncer i prepared statements
- PgBouncer i search_path
- PgBouncer - konfiguracja i monitoring
- PgBouncer - edge case'y produkcyjne
- Migracje schematu
- Migracje danych
- Backupy
- Point-in-time recovery
- Replikacja fizyczna i HA
- Load balancing
- Bezpieczeństwo
- Schematy i uprawnienia
- Monitoring
- Logowanie
- Testy i QA
- Scenariusze testowe dla edge case'ów
- Procedury operacyjne
- Minimalny zestaw SQL dla diagnostyki
- Minimalny zestaw ustawień dla aplikacji
- Minimalny zestaw komend PgBouncer dla diagnostyki
- Checklist do code review

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (167 linii) - Overview; Cel dokumentu; Zasady ogólne; Warstwy odpowiedzialności; +4 więcej
- `02-jsonb.md` (176 linii) - JSONB; Partycjonowanie; Indeksy; Zapytania; +1 więcej
- `03-statystyki-plannerowe.md` (174 linii) - Statystyki plannerowe; Transakcje; Blokady i współbieżność; Persistence aplikacji; +1 więcej
- `04-connection-pooling.md` (172 linii) - Connection pooling; PgBouncer - tryby pracy; PgBouncer vs direct connection; PgBouncer i prepared statements; +1 więcej
- `05-pgbouncer-konfiguracja-i-monitoring.md` (187 linii) - PgBouncer - konfiguracja i monitoring; PgBouncer - edge case'y produkcyjne; Migracje schematu; Migracje danych; +1 więcej
- `06-point-in-time-recovery.md` (117 linii) - Point-in-time recovery; Replikacja fizyczna i HA; Load balancing; Bezpieczeństwo; +1 więcej
- `07-monitoring.md` (182 linii) - Monitoring; Logowanie; Testy i QA; Scenariusze testowe dla edge case'ów
- `08-procedury-operacyjne.md` (161 linii) - Procedury operacyjne; Minimalny zestaw SQL dla diagnostyki
- `09-minimalny-zestaw-ustawien-dla-aplikacji.md` (88 linii) - Minimalny zestaw ustawień dla aplikacji; Minimalny zestaw komend PgBouncer dla diagnostyki
- `10-checklist-do-code-review.md` (107 linii) - Checklist do code review
