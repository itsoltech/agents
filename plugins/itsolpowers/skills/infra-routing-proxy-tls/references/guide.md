# infra-routing-proxy-tls Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `infrastructure-deployment-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Review ingressu, proxy i TLS: Traefik/NGINX, routing, certyfikaty, LB, long-lived connections, forwarded headers, real client IP, DNS/CDN cache edge.

## Przeniesione sekcje

- Nomad - Traefik jako ingress
- Nomad - NGINX jako reverse proxy
- Routing i reverse proxy
- Certyfikaty i TLS
- Load balancing
- WebSocket, SSE i połączenia długie
- Nagłówki proxy i prawdziwy IP klienta
- DNS, CDN i cache edge
- Checklist do review infrastruktury

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (194 linii) - Overview; Nomad - Traefik jako ingress; Nomad - NGINX jako reverse proxy; Routing i reverse proxy; +5 więcej
- `02-checklist-do-review-infrastruktury.md` (107 linii) - Checklist do review infrastruktury
