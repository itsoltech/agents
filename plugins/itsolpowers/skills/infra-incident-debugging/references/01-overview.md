# infra-incident-debugging Reference Sector: Overview

## Zawartość

- Overview
- Health checks
- Nomad - restart, reschedule i awarie alokacji
- Nomad - migrate i node drain
- Nomad - monitoring i diagnostyka
- Routing i reverse proxy
- Certyfikaty i TLS
- Nagłówki proxy i prawdziwy IP klienta
- Metryki, SLO i alerting


## Health checks

Health check nie powinien być przypadkowym endpointem. Musi mieć konkretną semantykę.

Podział:

- `startup` - aplikacja zakończyła inicjalizację
- `liveness` - proces nie jest martwy i może zostać zrestartowany, jeśli nie odpowiada
- `readiness` - aplikacja może przyjmować ruch
- `dependency` - stan połączenia z bazą, cache, kolejką, usługą zewnętrzną

Zasady:

- readiness może zależeć od lokalnej gotowości aplikacji i minimalnych zależności
- liveness nie powinien padać tylko dlatego, że baza miała chwilową awarię
- health check nie powinien wykonywać ciężkich zapytań do bazy
- health check nie powinien wymagać autoryzacji, ale endpoint powinien być ograniczony sieciowo albo zwracać tylko stan techniczny
- health check powinien mieć timeout krótszy niż timeout proxy
- health check powinien wykrywać deadlocki runtime, zapełnienie kolejki, brak gotowości workerów albo brak możliwości obsługi requestów, jeśli te stany są krytyczne
- endpoint readiness powinien przejść na failure podczas graceful shutdown, zanim proces zamknie połączenia
- w Nomad service check traktuj jako informację dla service discovery i deployment health, nie jako pełny test biznesowy
## Nomad - restart, reschedule i awarie alokacji

`restart` opisuje restart taska na tym samym kliencie. `reschedule` opisuje przeniesienie alokacji na inny node po wyczerpaniu restartów albo failure alokacji.[^nomad-restart][^nomad-reschedule]

Zasady:

- rozdzielaj problemy restartowalne od problemów wymagających reschedule
- dla aplikacji, która crashuje przez błąd konfiguracji, szybkie nieskończone restarty tylko generują hałas
- dla workerów zależnych od chwilowych awarii zewnętrznych użyj backoffu
- nie ustawiaj `unlimited = true` bez alertów i limitów
- monitoruj restart count, failed allocations i reschedule events
- częste restarty traktuj jako incident, nawet jeśli service discovery nadal pokazuje zdrowe repliki
- crash loop powinien być widoczny w alertach
## Nomad - migrate i node drain

`migrate` określa strategię migracji alokacji z draining nodes. Nomad używa migrate przy node drain dla service jobs z `count > 1`; przy utracie noda lub failure alokacji używane są inne mechanizmy.[^nomad-migrate]

Zasady:

- każdy service job z wieloma replikami powinien mieć `migrate`
- przed pracami na hoście ustaw node jako ineligible albo drain, nie zabijaj procesów ręcznie
- drain powinien mieć deadline i być monitorowany
- nie drainuj wielu nodów naraz bez sprawdzenia capacity
- system jobs, log shippers i monitoring per-node mają inne zachowanie podczas drainu niż service jobs
- batch jobs mogą blokować drain, jeśli mają długi czas działania
- przed restartem hosta sprawdź alokacje, które nie mogą się przenieść przez constraints, volumes albo brak capacity
- po drainie sprawdź, czy alokacje wróciły do oczekiwanej liczby i czy service discovery widzi zdrowe instancje

Podstawowe komendy operacyjne:

```bash
nomad node status
nomad node status -self
nomad node drain -enable -deadline 30m <node-id>
nomad node eligibility -disable <node-id>
nomad allocation status <alloc-id>
nomad alloc logs <alloc-id>
```
## Nomad - monitoring i diagnostyka

Nomad emituje metryki serwerów, klientów i alokacji. Dokumentacja wskazuje, że część metryk lidera pojawia się tylko na aktualnym leaderze, a metryki hosta i alokacji na klientach wymagają jawnego włączenia.[^nomad-monitor][^nomad-metrics]

Monitoruj:

- leader changes
- Raft peers i quorum
- pending evaluations
- failed allocations
- restarts i reschedules
- deployment failures
- node readiness
- client CPU/memory/disk pressure
- allocation CPU/memory
- liczba allocs per node
- długość drainów
- błędy service registration
- błędy template rendering i Vault renewal

Komendy diagnostyczne:

```bash
nomad server members
nomad node status
nomad job status <job>
nomad job plan job.nomad.hcl
nomad deployment status <deployment-id>
nomad alloc status <alloc-id>
nomad alloc logs -stderr <alloc-id>
nomad alloc exec -task <task> <alloc-id> /bin/sh
nomad operator raft list-peers
```

Zasady:

- alertuj na brak quorum i częste leader elections
- alertuj na pending allocations przez dłuższy czas
- alertuj na failed deployments
- alertuj na restart loops
- nie opieraj monitoringu tylko o stan reverse proxy
- metryki aplikacji muszą być widoczne obok metryk Nomad
- logi alokacji powinny być centralnie zbierane
- logi Nomad server i client powinny być zbierane osobno od logów aplikacji
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
## Nagłówki proxy i prawdziwy IP klienta

Błędna obsługa nagłówków proxy prowadzi do złych logów, błędnych limitów, obejścia allowlist i problemów z URLami generowanymi przez aplikację.

Zasady:

- aplikacja powinna ufać `X-Forwarded-*` tylko, jeśli request pochodzi z zaufanego proxy
- reverse proxy powinien nadpisywać, a nie ślepo przekazywać nagłówki od klienta
- przy wielu proxy ustal, które z nich jest źródłem prawdy dla client IP
- w aplikacji jawnie skonfiguruj trusted proxies
- loguj zarówno IP widziany przez proxy, jak i wynikowy client IP, jeśli pomaga to w audycie
- testuj działanie za CDN, za VPN i bezpośrednio w sieci wewnętrznej
## Metryki, SLO i alerting

Google SRE Workbook opisuje alertowanie oparte o SLO jako sposób ograniczania alertów do objawów realnie ważnych dla użytkownika.[^google-sre-slo]

Zasady:

- definiuj SLI: availability, latency, error rate, freshness, queue age
- alertuj na objawy, nie tylko przyczyny
- alert na CPU 90% może być noise, jeśli latency i error rate są poprawne
- alert na error budget burn jest zwykle lepszy niż sztywny próg błędów
- alertuj na brak backupu, brak restore testu, certyfikaty blisko wygaśnięcia, zapełnienie dysku
- alertuj na Nomad: brak quorum, failed deployment, pending allocations, node down, restart loop
- alerty powinny mieć ownera, runbook i severity
- testuj alerty, nie tylko dashboardy
