# infra-edge-protection Reference

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

## DNS, CDN i cache edge

Zasady:

- TTL DNS dopasuj do sposobu failoveru
- dla publicznych usług używaj nazw, nie IP w konfiguracji klientów
- CDN cache powinien być jawny: co jest cache'owane, jak długo, jak invalidowane
- nie cache'uj odpowiedzi użytkownika jako publicznych
- nagłówki `Cache-Control` powinny wynikać z typu zasobu
- assets frontendowe z hashem w nazwie mogą mieć długi cache
- HTML aplikacji SPA/SSR zwykle nie powinien mieć długiego cache bez kontroli invalidacji
- monitoruj błędne cache hit dla endpointów prywatnych

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

## Nagłówki proxy i prawdziwy IP klienta

Błędna obsługa nagłówków proxy prowadzi do złych logów, błędnych limitów, obejścia allowlist i problemów z URLami generowanymi przez aplikację.

Zasady:

- aplikacja powinna ufać `X-Forwarded-*` tylko, jeśli request pochodzi z zaufanego proxy
- reverse proxy powinien nadpisywać, a nie ślepo przekazywać nagłówki od klienta
- przy wielu proxy ustal, które z nich jest źródłem prawdy dla client IP
- w aplikacji jawnie skonfiguruj trusted proxies
- loguj zarówno IP widziany przez proxy, jak i wynikowy client IP, jeśli pomaga to w audycie
- testuj działanie za CDN, za VPN i bezpośrednio w sieci wewnętrznej

## Checklist do review infrastruktury

### Artefakty

- czy obraz jest budowany przez CI?
- czy obraz ma wersję, SHA i metadane?
- czy produkcja używa konkretnego tagu albo digestu?
- czy finalny obraz nie zawiera narzędzi buildowych?
- czy sekrety nie trafiają do obrazu ani build args?
- czy obraz jest skanowany?
- czy jest SBOM/provenance dla produkcji?

### Runtime

- czy proces działa jako non-root?
- czy kontener ma ograniczone capabilities?
- czy filesystem może być read-only?
- czy są limity CPU/RAM?
- czy healthcheck ma poprawną semantykę?
- czy aplikacja obsługuje SIGTERM?
- czy logi idą na stdout/stderr?

### Nomad

- czy job spec jest w repo?
- czy `type` joba pasuje do workloadu?
- czy job ma jawne `datacenters`, `namespace` i `node_pool`, jeśli są używane?
- czy każdy task ma `resources`?
- czy service job ma `update`, `restart`, `reschedule` i `migrate`?
- czy service registration ma health check?
- czy porty są nazwane?
- czy nie użyto static port bez powodu?
- czy constraints/affinity/spread nie blokują placementu?
- czy deployment ma rollback albo `auto_revert`?
- czy CI wykonuje `nomad job plan`?
- czy node drain został przetestowany?
- czy pending allocations są monitorowane?
- czy restarty i failed deployments są alertowane?

### Routing

- czy publicznie wystawiony jest tylko reverse proxy/LB?
- czy routing jest jawny i wersjonowany?
- czy każdy host ma TLS?
- czy HTTP przekierowuje do HTTPS?
- czy dashboardy admin są zabezpieczone?
- czy `X-Forwarded-*` są poprawnie ustawione?
- czy aplikacja ma skonfigurowane trusted proxies?
- czy WebSocket/SSE mają właściwe timeouty?

### Load balancing

- czy backendy są wycinane z rotacji po failed readiness?
- czy connection draining działa?
- czy retry nie powtarza nieidempotentnych operacji?
- czy sticky sessions są świadome i przetestowane?
- czy long-lived connections są uwzględnione w deployu?

### Dane

- czy baza nie jest publiczna?
- czy migracje są kompatybilne wstecznie?
- czy pool DB uwzględnia liczbę replik?
- czy backup jest automatyczny?
- czy restore był testowany?
- czy cache ma TTL albo limit?
- czy kolejki mają retry, backoff i DLQ?

### Sekrety

- czy sekrety nie są w obrazie ani repo?
- czy Vault/Nomad Variables mają minimalne ACL?
- czy rotacja sekretu była testowana?
- czy template ma opisany `change_mode`?
- czy logi nie zawierają sekretów?

### Observability

- czy są logi, metryki i trace'y?
- czy request id przechodzi przez proxy i aplikację?
- czy dashboard pokazuje aplikację i Nomad razem?
- czy alerty mają ownera i runbook?
- czy są alerty na certyfikaty, backup, dysk, Nomad quorum i failed deployments?

### Bezpieczeństwo

- czy host firewall blokuje wszystko poza wymaganymi portami?
- czy SSH jest ograniczone?
- czy Docker socket nie jest montowany do kontenerów?
- czy panele admin nie są publiczne?
- czy CVE są skanowane i mają politykę wyjątków?
- czy uprawnienia CI/CD są minimalne?

### Deployment

- czy rollback jest opisany i przetestowany?
- czy staging odpowiada produkcyjnemu routingowi?
- czy smoke test przechodzi przez realny proxy?
- czy release może być zatrzymany po metrykach?
- czy migracje danych są oddzielone od dużych zmian kodu?
- czy feature flags mają właściciela i termin usunięcia?
