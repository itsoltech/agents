# infra-routing-proxy-tls Reference Sector: Overview

## Zawartość

- Overview
- Nomad - Traefik jako ingress
- Nomad - NGINX jako reverse proxy
- Routing i reverse proxy
- Certyfikaty i TLS
- Load balancing
- WebSocket, SSE i połączenia długie
- Nagłówki proxy i prawdziwy IP klienta
- DNS, CDN i cache edge


## Nomad - Traefik jako ingress

Traefik ma provider dla Nomad Service Discovery oraz Consul Catalog. Provider Nomad tworzy routery i services na podstawie usług zarejestrowanych w Nomad, a port może zostać wykryty zgodnie z flow Nomad Service Discovery.[^traefik-nomad-provider][^traefik-nomad-routing]

Zasady:

- ustaw `exposedByDefault=false` albo równoważną politykę allowlisty
- publiczne routery definiuj jawnie przez tagi albo kontrolowany dynamic config
- używaj constraints, żeby Traefik nie czytał usług z niechcianych namespace, środowisk albo tagów
- nie polegaj na domyślnej regule hosta dla produkcji
- tagi Traefika trzymaj przy service registration albo generuj przez template, ale nie mieszaj ręcznych wyjątków bez dokumentacji
- każdy router powinien mieć `entrypoints`, TLS i middlewares
- dashboard Traefika zabezpiecz auth, VPN albo allowlistą IP
- ACME storage musi być trwały i backupowany
- Traefik uruchamiaj jako osobny job, zwykle `service` z count > 1 albo `system` zależnie od topologii edge
- jeśli Traefik działa na wielu node'ach i zarządza ACME, sprawdź mechanizm współdzielenia certyfikatów albo użyj centralnego storage/issuer
- dla WebSocket/SSE ustaw timeouty i connection draining zgodnie z zachowaniem aplikacji

Przykład tagów:

```hcl
service {
  name = "api"
  port = "http"
  tags = [
    "traefik.enable=true",
    "traefik.http.routers.api.rule=Host(`api.example.com`)",
    "traefik.http.routers.api.entrypoints=websecure",
    "traefik.http.routers.api.tls.certresolver=letsencrypt",
    "traefik.http.routers.api.middlewares=secure-headers@file,api-rate-limit@file"
  ]
}
```
## Nomad - NGINX jako reverse proxy

NGINX może działać jako edge proxy przed usługami Nomad. W takim układzie upstreamy mogą być generowane z service discovery albo wskazywane przez Consul DNS/template.

Zasady:

- nie utrzymuj ręcznie listy upstreamów, jeśli usługi skalują się w Nomad
- generuj upstreamy z Consul Template, Nomad template albo użyj Traefika dla dynamicznego discovery
- jeśli NGINX stoi przed Traefikiem, jasno rozdziel odpowiedzialności obu warstw
- jeśli NGINX robi TLS termination, Traefik nie powinien równolegle próbować obsługiwać tych samych certyfikatów bez powodu
- access log powinien zawierać request id, upstream address, upstream status i upstream response time

Przykład WebSocket w NGINX:

```nginx
location /ws/ {
    proxy_pass http://ws_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 3600s;
}
```

NGINX wymaga jawnego przekazania `Upgrade` i `Connection` dla WebSocket, bo są to nagłówki hop-by-hop.[^nginx-websocket]
## Routing i reverse proxy

Reverse proxy powinien być kontrolowanym punktem wejścia do systemu. NGINX, Traefik, HAProxy, Caddy, Envoy i API gateway robią podobne rzeczy, ale różnią się modelem konfiguracji.

Zadania reverse proxy:

- TLS termination
- host/path routing
- przekazywanie nagłówków proxy
- load balancing do instancji backendu
- WebSocket/gRPC handling
- rate limiting
- request body limits
- redirect HTTP do HTTPS
- security headers
- access logs
- basic auth lub allowlist dla paneli admin/dev
- centralne timeouty i retry

Zasady:

- routing powinien być jawny: host, path, service, port, TLS, middlewares
- nie wystawiaj usług automatycznie bez allowlisty
- nie trzymaj produkcyjnej konfiguracji proxy tylko w ręcznie edytowanym pliku na serwerze
- trzymaj konfigurację proxy w repo albo systemie IaC
- standardyzuj nazwy routerów, usług i middlewares
- oddziel config statyczny proxy od dynamicznego routingu usług
- każdy publiczny host powinien mieć właściciela, service, środowisko i sposób renew certyfikatu
- nie mieszaj routingu dev/staging/prod na jednym hoście bez jasnych reguł i izolacji
## Certyfikaty i TLS

TLS powinien być automatyczny, monitorowany i odnawiany bez ręcznej pracy. Let's Encrypt ma rate limity, które zwykle nie przeszkadzają przy normalnym użyciu, ale błędne pętle renew/testów mogą je wyczerpać.[^letsencrypt-rate-limits]

Zasady:

- używaj ACME do automatycznego wydawania i odnawiania certyfikatów
- na stagingu i w testach używaj staging environment ACME, gdy testujesz wystawianie certyfikatów; Let's Encrypt opisuje staging jako środowisko z większymi limitami do testów[^letsencrypt-staging]
- monitoruj datę wygaśnięcia certyfikatów
- alarmuj przed wygaśnięciem, np. 30, 14 i 7 dni wcześniej
- backupuj storage certyfikatów, np. `acme.json`, jeśli proxy sam zarządza certami
- nie kopiuj prywatnych kluczy między serwerami ręcznie bez kontroli dostępu
- dla wildcard używaj DNS-01 challenge
- dla HTTP-01 upewnij się, że port 80 jest osiągalny z internetu
- dla TLS-ALPN-01 upewnij się, że port 443 trafia do klienta ACME
- nie odpalaj wielu niezależnych klientów ACME dla tego samego zestawu domen bez koordynacji
- nie uruchamiaj ACME w CI jako testu per commit
- ustaw redirect HTTP do HTTPS
- rozważ HSTS dopiero po sprawdzeniu wszystkich subdomen i procesu awaryjnego; HSTS każe przeglądarce używać HTTPS dla domeny po otrzymaniu nagłówka[^owasp-hsts]
- używaj TLS 1.2/1.3 lub zgodnego profilu organizacyjnego; OWASP TLS Cheat Sheet opisuje zasady konfiguracji TLS dla aplikacji webowych[^owasp-tls]
- paneli admin nie wystawiaj tylko przez ukryty subdomain; dodaj auth, VPN, IP allowlistę albo mTLS
## Load balancing

Load balancing nie jest tylko rozdzielaniem ruchu. Musi uwzględniać health checki, timeouty, retry, sticky sessions, connection draining i sposób deploymentu.

NGINX wspiera kilka algorytmów load balancingu, między innymi round robin, least connections i hashing; NGINX Plus dodaje funkcje takie jak slow start i session persistence.[^nginx-load-balancing]

Zasady:

- aplikacje projektuj jako stateless, jeśli mają skalować się horyzontalnie
- sesję użytkownika trzymaj w cookie/JWT, Redis, bazie albo zewnętrznym session store
- sticky sessions stosuj tylko, gdy nie da się szybko usunąć zależności od lokalnego stanu
- jeżeli używasz sticky sessions, testuj rolling deployment i awarię konkretnej instancji
- load balancer powinien wysyłać ruch tylko do instancji healthy/ready
- health check nie powinien przeciążać backendu
- retry w proxy stosuj ostrożnie, zwłaszcza dla metod nieidempotentnych
- endpointy mutujące dane powinny obsługiwać idempotency key, jeśli retry jest możliwy
- ustaw timeout connect krótszy niż ogólny request timeout
- nie ustawiaj bardzo długich timeoutów dla wszystkich endpointów tylko dlatego, że jeden endpoint jest wolny
- osobno traktuj HTTP requesty, WebSocket, SSE, gRPC i uploady
- connection draining powinien dać aplikacji czas na zakończenie aktywnych requestów
## WebSocket, SSE i połączenia długie

Połączenia długie zmieniają model skalowania. Liczba requestów na sekundę przestaje wystarczać; trzeba liczyć otwarte połączenia, heartbeat, pamięć na connection, reconnect storm i limity proxy.

Zasady:

- dla WebSocket ustaw poprawne proxy headers `Upgrade` i `Connection`
- dla WebSocket/SSE ustaw dłuższy `read_timeout` niż dla zwykłego HTTP
- dodaj heartbeat/ping-pong i wykrywanie martwych połączeń
- ogranicz liczbę połączeń per użytkownik/IP/tenant
- obsłuż reconnect storm po restarcie proxy albo deploymencie
- nie trzymaj lokalnie stanu, którego utrata zerwie spójność systemu
- przy skalowaniu wielu instancji użyj pub/sub, message broker albo shared event bus
- połączenia długie muszą być uwzględnione w graceful shutdown
- przy rolling deploy readiness powinien przejść na false, a aplikacja powinna przestać przyjmować nowe połączenia przed zamknięciem starych
- testuj restart jednej instancji, restart proxy i chwilową utratę sieci

Edge case'y:

- wszystkie klienty reconnectują po deploymencie i zalewają edge
- LB trzyma połączenia na instancji, która już jest w trakcie shutdownu
- sticky sessions maskują problem lokalnego stanu
- eventy trafiają do klienta dwa razy po reconnect
- proxy ma krótszy timeout niż heartbeat aplikacji
## Nagłówki proxy i prawdziwy IP klienta

Błędna obsługa nagłówków proxy prowadzi do złych logów, błędnych limitów, obejścia allowlist i problemów z URLami generowanymi przez aplikację.

Zasady:

- aplikacja powinna ufać `X-Forwarded-*` tylko, jeśli request pochodzi z zaufanego proxy
- reverse proxy powinien nadpisywać, a nie ślepo przekazywać nagłówki od klienta
- przy wielu proxy ustal, które z nich jest źródłem prawdy dla client IP
- w aplikacji jawnie skonfiguruj trusted proxies
- loguj zarówno IP widziany przez proxy, jak i wynikowy client IP, jeśli pomaga to w audycie
- testuj działanie za CDN, za VPN i bezpośrednio w sieci wewnętrznej
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
