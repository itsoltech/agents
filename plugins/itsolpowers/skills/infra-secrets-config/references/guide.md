# infra-secrets-config Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `infrastructure-deployment-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Review sekretów i konfiguracji infrastruktury: env/runtime config, Vault, Nomad templates, workload identity, CI credentials, build args, registry secrets, IaC state i drift.

## Przeniesione sekcje

- Konfiguracja środowisk
- Nomad - konfiguracja i sekrety
- Nomad - template, Vault i workload identity
- Artefakty i wersjonowanie
- Budowanie obrazów Dockerowych
- SBOM, provenance i supply chain
- IaC, GitOps i drift
- CI/CD dla infrastruktury i obrazów
- Checklist do review infrastruktury

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (187 linii) - Overview; Konfiguracja środowisk; Nomad - konfiguracja i sekrety; Nomad - template, Vault i workload identity; +5 więcej
- `02-checklist-do-review-infrastruktury.md` (107 linii) - Checklist do review infrastruktury
