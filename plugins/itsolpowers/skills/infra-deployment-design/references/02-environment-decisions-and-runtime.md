# Environment Decisions And Runtime

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
