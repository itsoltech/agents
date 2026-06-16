# Edge Network Model

Ten plik jest wewnętrzną referencją skilla, wyciętą z `infrastructure-deployment-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj poniższej wiedzy bezpośrednio.

## Zakres

Review ochrony edge: public exposure, WAF/CDN/cache safety, rate limits, body/time limits, DDoS/abuse controls, segmentacja sieci i zależność od prawdziwego IP klienta.

## Przeniesione sekcje

- Model warstw
- Rate limiting i ochrona edge
- DNS, CDN i cache edge
- Sieć i segmentacja
- Nagłówki proxy i prawdziwy IP klienta
- Checklist do review infrastruktury

## Wiedza skilla

## Model warstw

Najpierw rozdziel odpowiedzialności. Problemy produkcyjne często wynikają z mieszania poziomów: aplikacja robi rzeczy, które powinien robić proxy, proxy przechowuje stan aplikacyjny, a deployment nie ma informacji o health checkach.

Typowy podział:

```text
Internet / CDN / DNS
        |
Edge load balancer / firewall / WAF
        |
Reverse proxy / ingress / API gateway
        |
Service discovery / internal load balancing
        |
Nomad clients / kontenery aplikacyjne
        |
Bazy danych / cache / kolejki / object storage
        |
Backup / monitoring / logi / tracing / alerting
```

Zasady:

- publicznie wystawiaj tylko warstwę edge
- aplikacje trzymaj w sieciach prywatnych
- certyfikaty kończ w kontrolowanym miejscu: edge proxy, reverse proxy albo dedykowany LB
- logika routingu powinna być jawna i wersjonowana
- aplikacja nie powinna zależeć od konkretnego hosta, jeśli ma się skalować horyzontalnie
- stan aplikacji trzymaj poza procesem: baza, Redis, object storage, queue, shared persistent storage tylko tam, gdzie jest uzasadniony
- każdy komponent powinien mieć health check, metryki, logi i opisany sposób restartu
- każdy publiczny endpoint powinien mieć właściciela, limit request body, timeouty i zasady rate limitingu

## Rate limiting i ochrona edge

Rate limiting powinien chronić zasoby, a nie udawać pełny system autoryzacji.

Zasady:

- ograniczaj szczególnie: login, reset hasła, publiczne wyszukiwarki, uploady, endpointy AI/LLM, eksporty, webhooki
- stosuj osobne limity dla IP, użytkownika, tenant ID, API key albo endpointu
- nie opieraj limitów wyłącznie o IP, jeśli ruch idzie przez NAT, firmowe sieci albo mobile operators
- poprawnie wyznacz prawdziwy IP klienta za CDN/proxy
- ustaw limity body size i liczby połączeń
- dla webhooków stosuj podpisy payloadu i replay protection
- dla endpointów kosztownych dodaj kolejkę, quota albo token bucket na poziomie aplikacji
- rate limiting w proxy i w aplikacji mogą działać razem: proxy chroni edge, aplikacja rozumie użytkownika i tenant
- loguj odrzucenia z powodem i correlation id

## Sieć i segmentacja

Zasady:

- publicznie wystawiaj tylko edge proxy i ewentualnie VPN
- bazy danych, cache, kolejki i Nomad/Consul/Vault API trzymaj w prywatnej sieci
- host firewall powinien blokować wszystko poza wymaganymi portami
- SSH ogranicz do VPN, allowlisty albo bastiona
- komunikacja między hostami klastra powinna być jawnie opisana
- nie używaj publicznych IP do komunikacji wewnętrznej, jeśli dostępna jest sieć prywatna
- jeśli używasz Consul/Vault/Nomad, zabezpiecz ich porty przed publicznym dostępem
- dokumentuj porty control plane i data plane
