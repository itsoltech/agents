# infra-container-runtime-review Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `infrastructure-deployment-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Review zachowania kontenera po uruchomieniu: runtime, health checki, restart, SIGTERM, volumes, stdout/stderr, Compose i runtime security.

## Przeniesione sekcje

- Runtime kontenerów
- Health checks
- Docker Compose na produkcji
- Bezpieczeństwo obrazu
- Checklist do review infrastruktury

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (141 linii) - Overview; Runtime kontenerów; Health checks; Docker Compose na produkcji; +1 więcej
- `02-checklist-do-review-infrastruktury.md` (107 linii) - Checklist do review infrastruktury
