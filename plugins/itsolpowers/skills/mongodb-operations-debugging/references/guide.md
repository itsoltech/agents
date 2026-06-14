# mongodb-operations-debugging Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `mongodb-database-operations-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

MongoDB operations debugging

## Przeniesione sekcje

- Query optimization
- Aggregation pipeline
- Connection pooling i konfiguracja drivera
- Read concern, write concern i read preference
- Replica set
- Replication lag
- Sharding
- Shard key
- Balancer, chunks i operacje sharded cluster
- Backup i restore
- Observability i monitoring
- Slow query workflow
- Storage, system operacyjny i self-managed deployment
- Kontenery i MongoDB
- MongoDB w Nomad / własnej infrastrukturze
- Administracja i operacje utrzymaniowe
- Index builds i zmiany indeksów
- Importy, eksporty i bulk operations
- Dane tymczasowe, TTL i retencja
- Time series collections
- Change streams
- Checklist administracyjny
- Minimalny runbook incydentu MongoDB

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (172 linii) - Overview; Query optimization; Aggregation pipeline; Connection pooling i konfiguracja drivera; +2 więcej
- `02-replication-lag.md` (145 linii) - Replication lag; Sharding; Shard key; Balancer, chunks i operacje sharded cluster; +1 więcej
- `03-observability-i-monitoring.md` (177 linii) - Observability i monitoring; Slow query workflow; Storage, system operacyjny i self-managed deployment; Kontenery i MongoDB; +3 więcej
- `04-importy-eksporty-i-bulk-operations.md` (174 linii) - Importy, eksporty i bulk operations; Dane tymczasowe, TTL i retencja; Time series collections; Change streams; +2 więcej
