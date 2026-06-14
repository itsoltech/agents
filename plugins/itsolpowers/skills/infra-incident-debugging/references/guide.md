# infra-incident-debugging Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `infrastructure-deployment-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Debugowanie incydentów infrastruktury: symptomy, health checki, crash loops, reschedule, node drain, proxy/TLS/client IP, logi, metryki, Nomad diagnostyka i typowe awarie.

## Przeniesione sekcje

- Health checks
- Nomad - restart, reschedule i awarie alokacji
- Nomad - migrate i node drain
- Nomad - monitoring i diagnostyka
- Routing i reverse proxy
- Certyfikaty i TLS
- Nagłówki proxy i prawdziwy IP klienta
- Metryki, SLO i alerting
- Logi i cardinality
- Edge case'y, które często powodują awarie

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (194 linii) - Overview; Health checks; Nomad - restart, reschedule i awarie alokacji; Nomad - migrate i node drain; +5 więcej
- `02-logi-i-cardinality.md` (48 linii) - Logi i cardinality; Edge case'y, które często powodują awarie
