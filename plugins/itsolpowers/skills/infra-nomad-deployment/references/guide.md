# infra-nomad-deployment Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `infrastructure-deployment-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Projektowanie i review Nomad jobów: task groups, allocations, update/canary/rollback, restart/reschedule, node drain, service discovery, Traefik/NGINX, Vault, lifecycle, storage, ACL, monitoring i autoscaling.

## Przeniesione sekcje

- Nomad - rola w architekturze
- Nomad - podstawowy model pojęć
- Nomad - standard job speca
- Nomad - zasoby i placement
- Nomad - update, rollback i canary
- Nomad - restart, reschedule i awarie alokacji
- Nomad - migrate i node drain
- Nomad - sieć, porty i service discovery
- Nomad - Traefik jako ingress
- Nomad - NGINX jako reverse proxy
- Nomad - konfiguracja i sekrety
- Nomad - template, Vault i workload identity
- Nomad - lifecycle tasks i sidecary
- Nomad - storage i stateful workloads
- Nomad - namespaces, ACL i dostęp operatorski
- Nomad - monitoring i diagnostyka
- Nomad - autoscaling
- Checklist do review infrastruktury

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (189 linii) - Overview; Nomad - rola w architekturze; Nomad - podstawowy model pojęć; Nomad - standard job speca; +1 więcej
- `02-nomad-update-rollback-i-canary.md` (182 linii) - Nomad - update, rollback i canary; Nomad - restart, reschedule i awarie alokacji; Nomad - migrate i node drain; Nomad - sieć, porty i service discovery; +3 więcej
- `03-nomad-template-vault-i-workload-identity.md` (153 linii) - Nomad - template, Vault i workload identity; Nomad - lifecycle tasks i sidecary; Nomad - storage i stateful workloads; Nomad - namespaces, ACL i dostęp operatorski; +2 więcej
- `04-checklist-do-review-infrastruktury.md` (107 linii) - Checklist do review infrastruktury
