# infra-container-build-review Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `infrastructure-deployment-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Review artefaktów i obrazów: wersjonowanie, Dockerfile, cache, base image, non-root, CVE, SBOM, provenance, registry i powtarzalność builda.

## Przeniesione sekcje

- Artefakty i wersjonowanie
- Budowanie obrazów Dockerowych
- Rozmiar obrazu i cache builda
- Bezpieczeństwo obrazu
- SBOM, provenance i supply chain
- Checklist do review infrastruktury

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (161 linii) - Overview; Artefakty i wersjonowanie; Budowanie obrazów Dockerowych; Rozmiar obrazu i cache builda; +2 więcej
- `02-checklist-do-review-infrastruktury.md` (107 linii) - Checklist do review infrastruktury
