# postgres-operations-debugging Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `postgresql-database-operations-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

PostgreSQL operations debugging

## Przeniesione sekcje

- EXPLAIN i analiza planów
- Statystyki plannerowe
- Blokady i współbieżność
- Liczba połączeń i capacity planning
- Connection pooling
- PgBouncer - tryby pracy
- PgBouncer vs direct connection
- PgBouncer i prepared statements
- PgBouncer i search_path
- PgBouncer - konfiguracja i monitoring
- PgBouncer - edge case'y produkcyjne
- Direct connection - kiedy omijać PgBouncer
- Backupy
- Point-in-time recovery
- Replikacja fizyczna i HA
- Patroni i automatyczny failover
- Load balancing
- Replikacja logiczna
- Sharding i rozproszenie danych
- Vacuum, autovacuum i bloat
- ANALYZE
- Konfiguracja serwera
- Storage i system operacyjny
- Monitoring
- Logowanie
- Rozwiązywanie problemów
- Upgrade'y
- Kontenery i Nomad
- Procedury operacyjne
- Minimalny zestaw SQL dla diagnostyki
- Minimalny zestaw ustawień dla aplikacji
- Minimalny zestaw komend PgBouncer dla diagnostyki

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (185 linii) - Overview; EXPLAIN i analiza planów; Statystyki plannerowe; Blokady i współbieżność; +2 więcej
- `02-pgbouncer-tryby-pracy.md` (152 linii) - PgBouncer - tryby pracy; PgBouncer vs direct connection; PgBouncer i prepared statements; PgBouncer i search_path
- `03-pgbouncer-konfiguracja-i-monitoring.md` (182 linii) - PgBouncer - konfiguracja i monitoring; PgBouncer - edge case'y produkcyjne; Direct connection - kiedy omijać PgBouncer; Backupy; +2 więcej
- `04-patroni-i-automatyczny-failover.md` (145 linii) - Patroni i automatyczny failover; Load balancing; Replikacja logiczna; Sharding i rozproszenie danych; +4 więcej
- `05-monitoring.md` (99 linii) - Monitoring; Logowanie
- `06-rozwiazywanie-problemow.md` (175 linii) - Rozwiązywanie problemów; Upgrade'y; Kontenery i Nomad
- `07-procedury-operacyjne.md` (161 linii) - Procedury operacyjne; Minimalny zestaw SQL dla diagnostyki
- `08-minimalny-zestaw-ustawien-dla-aplikacji.md` (88 linii) - Minimalny zestaw ustawień dla aplikacji; Minimalny zestaw komend PgBouncer dla diagnostyki
