# infra-nomad-deployment Reference Sector: Nomad - update, rollback i canary

## Zawartość

- Nomad - update, rollback i canary
- Nomad - restart, reschedule i awarie alokacji
- Nomad - migrate i node drain
- Nomad - sieć, porty i service discovery
- Nomad - Traefik jako ingress
- Nomad - NGINX jako reverse proxy
- Nomad - konfiguracja i sekrety

## Nomad - update, rollback i canary

Nomad `update` block kontroluje rolling upgrades i canary deployments.[^nomad-update]

Zasady:

- każdy service job powinien mieć jawny `update`
- `max_parallel` dopasuj do liczby replik i ryzyka deploymentu
- `min_healthy_time` powinien dać aplikacji czas na przejście health checków po starcie
- `healthy_deadline` powinien być krótszy niż czas, po którym użytkownicy odczują awarię deploymentu
- `progress_deadline` powinien zatrzymać deployment, który nie robi postępu
- używaj `auto_revert = true` dla usług, które powinny wrócić do poprzedniej wersji po nieudanym deployu
- canary stosuj dla zmian ryzykownych, ale miej metryki do oceny canary
- nie traktuj canary jako zamiennika kompatybilnych migracji DB
- przed deploymentem uruchamiaj `nomad job plan`
- po deploymentcie sprawdzaj `nomad job status`, `nomad deployment status` i metryki aplikacji

Edge case'y:

- health check jest zbyt płytki i deployment przechodzi mimo uszkodzonej funkcji
- readiness zależy od bazy i cały deploy zatrzymuje się podczas krótkiej awarii DB
- `max_parallel` jest zbyt wysokie i deployment usuwa za dużo zdrowych instancji naraz
- canary trafia na inny typ noda niż reszta workloadu i wynik testu nie jest reprezentatywny
- rollback kodu nie cofa migracji danych
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
## Nomad - sieć, porty i service discovery

Nomad networking obsługuje między innymi porty dynamiczne i statyczne oraz konfigurację network na poziomie group.[^nomad-networking] Service discovery może działać przez wbudowany provider Nomad albo przez Consul. Nomad z Consul daje automatyczne wykrywanie usług, health checking i dynamiczną konfigurację.[^nomad-service-discovery][^nomad-reference-architecture]

Zasady:

- porty nazywaj semantycznie: `http`, `grpc`, `metrics`, `admin`
- nie używaj static port, jeśli nie ma powodu
- static port jest uzasadniony dla edge proxy, lokalnych agentów albo protokołów wymagających stałego portu
- publicznie wystawiaj tylko Traefik/NGINX/LB, nie porty aplikacji
- service registration powinien wskazywać named port, nie przypadkowy numer
- każda usługa routowana przez proxy powinna mieć service check
- nazwy usług powinny być stabilne i spójne między środowiskami
- tagi service discovery traktuj jak API dla proxy, nie jak losowe komentarze
- usługi wewnętrzne powinny być dostępne przez service discovery, nie przez statyczne IP hosta
- przy wielu DC/regionach unikaj przypadkowego routingu do złego regionu

Przykład service:

```hcl
service {
  name = "orders-api"
  port = "http"

  check {
    name     = "ready"
    type     = "http"
    path     = "/health/ready"
    interval = "10s"
    timeout  = "2s"
  }
}
```
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
## Nomad - konfiguracja i sekrety

Nomad Variables pozwalają przechowywać małe porcje konfiguracji i sekretów w stanie Nomad. Dokumentacja Nomad zaznacza, że Variables nie są przeznaczone dla dużych ani szybko zmieniających się danych i nie są pełnym zamiennikiem Vault.[^nomad-variables]

Zasady:

- sekrety produkcyjne trzymaj w Vault, jeśli wymagają rotacji, dynamicznych credentiali albo ścisłego modelu dostępu
- Nomad Variables stosuj dla małych konfiguracji i prostych sekretów workloadów
- nie zapisuj wyników batch jobs, dużych payloadów ani szybko zmieniającego się stanu w Nomad Variables
- dostęp do Variables ogranicz przez ACL i namespace
- nie przekazuj sekretów przez job spec w plaintext commitowany do repo
- nie loguj renderowanych template z sekretami
- jeśli sekret zmienia się w runtime, jawnie zdecyduj, czy task ma dostać restart, signal, script czy noop
- testuj rotację sekretu na stagingu
