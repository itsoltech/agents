# infra-deployment-design Reference

Ten plik jest wewnętrzną referencją skilla, wyciętą z `infrastructure-deployment-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj poniższej wiedzy bezpośrednio.

## Zakres

Projektowanie topologii i granic infrastruktury: warstwy, ścieżka requestu, single-host vs Nomad, TLS, service discovery, sekrety, rollback i podstawowe decyzje środowiskowe.

## Przeniesione sekcje

- Cel dokumentu
- Model warstw
- Decyzje przed uruchomieniem środowiska
- Wybór modelu uruchamiania

## Wiedza skilla

## Cel dokumentu

Ten dokument opisuje dobre praktyki uruchamiania aplikacji na produkcji i w środowiskach pośrednich. Obejmuje obrazy Dockerowe, runtime kontenerów, routing, reverse proxy, certyfikaty, load balancing, clustering, Nomad, service discovery, deployment, obserwowalność, bezpieczeństwo, backupy i disaster recovery.

Dokument jest niezależny od backendu i frontendu. Aplikacja może być napisana w Rust, TypeScript, Effect, .NET, Pythonie, React, Svelte albo innym stacku. Zasady infrastrukturalne powinny pozostać podobne: artefakt ma być powtarzalny, runtime przewidywalny, routing jawny, skalowanie mierzalne, a awarie możliwe do diagnozy.

Założenie dla większych wdrożeń: **Nomad jest domyślnym schedulerem multi-node**. Docker Compose zostaje jako wariant single-host lub małe środowiska. Kubernetes jest poza głównym zakresem tego dokumentu, ponieważ dla tego modelu operacyjnego jest traktowany jako overkill.

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

## Decyzje przed uruchomieniem środowiska

Przed pierwszym deploymentem ustal:

- czy system działa jako single-host, multi-host, Docker Compose, Nomad albo inny scheduler
- które usługi są publiczne, a które tylko wewnętrzne
- gdzie kończy się TLS
- jak wygląda ścieżka requestu od klienta do aplikacji
- jak aplikacja otrzymuje prawdziwy IP klienta
- jak działa service discovery
- jak są przechowywane sekrety
- jak wygląda rollback
- czy migracje bazy są kompatybilne wstecznie
- gdzie są logi, metryki i trace'y
- jakie są limity CPU, RAM, dysku, request body, uploadów i liczby połączeń
- jakie są RPO i RTO dla danych
- kto ma dostęp do produkcji, registry, sekretów, DNS, certyfikatów, Nomad UI/API i hostów

Nie zaczynaj od narzędzia. Zacznij od wymagań: dostępność, ruch, poufność danych, budżet, czas odtworzenia, sposób pracy zespołu i wymagany poziom automatyzacji.

## Wybór modelu uruchamiania

Model uruchamiania powinien wynikać ze skali i sposobu utrzymania, a nie z mody na konkretny orchestrator.

### Single-host

Dobre dla małych instalacji, systemów wewnętrznych i środowisk, gdzie prostota diagnozy jest ważniejsza niż automatyczne przenoszenie workloadów między hostami.

Typowy zestaw:

- Docker Compose albo systemd
- Traefik/NGINX jako jedyny publiczny entrypoint
- prywatna sieć kontenerów
- automatyczny TLS
- backup danych poza host
- monitoring hosta i aplikacji
- prosty rollback przez zmianę tagu obrazu

### Multi-node z Nomad

Dobre dla aplikacji, które potrzebują kilku hostów, rolling deploy, service discovery, restartów, placementu, node drain i spójnego sposobu uruchamiania usług.

Typowy zestaw:

- 3 albo 5 serwerów Nomad w regionie produkcyjnym
- klienci Nomad jako nody wykonujące workloady
- Consul albo Nomad service discovery
- Traefik/NGINX jako edge reverse proxy
- Vault albo Nomad Variables dla sekretów i konfiguracji
- registry obrazów
- centralne logi, metryki i alerty
- job specs w repozytorium

### Kubernetes

Kubernetes traktuj jako osobną platformę, nie jako domyślny następny krok po Docker Compose. W tym modelu operacyjnym nie jest bazowym wyborem. Rozważ go dopiero wtedy, gdy realnie potrzebne są jego zasoby, ecosystem i zespół ma czas na utrzymanie klastra.
