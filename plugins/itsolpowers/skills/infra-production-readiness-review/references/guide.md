# infra-production-readiness-review Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `infrastructure-deployment-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Bramka produkcyjna: minimalne standardy single-host i Nomad, strategia deploymentu, IaC/GitOps/drift, CI/CD, host hardening, finalna checklista i rollback.

## Przeniesione sekcje

- Deployment strategie
- Bezpieczeństwo hosta
- IaC, GitOps i drift
- CI/CD dla infrastruktury i obrazów
- Minimalne standardy dla małej produkcji single-host
- Minimalne standardy dla Nomad multi-node
- Checklist do review infrastruktury

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (145 linii) - Overview; Deployment strategie; Bezpieczeństwo hosta; IaC, GitOps i drift; +3 więcej
- `02-checklist-do-review-infrastruktury.md` (107 linii) - Checklist do review infrastruktury
