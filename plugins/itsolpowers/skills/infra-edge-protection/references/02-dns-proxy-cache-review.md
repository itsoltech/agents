# DNS Proxy Cache And Review

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
