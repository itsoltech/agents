# infra-production-readiness-review Reference Sector: Overview

## Zawartość

- Overview
- Deployment strategie
- Bezpieczeństwo hosta
- IaC, GitOps i drift
- CI/CD dla infrastruktury i obrazów
- Minimalne standardy dla małej produkcji single-host
- Minimalne standardy dla Nomad multi-node


## Deployment strategie

Deployment to kontrolowana zmiana systemu, nie tylko uruchomienie nowego obrazu.

Strategie:

- rolling update - domyślny wybór dla większości usług stateless
- blue/green - dobry dla większych zmian i prostego rollbacku na poziomie routingu
- canary - dobry, gdy masz metryki i możliwość porównania wersji
- recreate - akceptowalny tylko dla usług, które mogą mieć przerwę
- manual migration window - dla zmian danych, których nie da się zrobić bez ryzyka

Zasady:

- migracje DB projektuj jako kompatybilne wstecznie
- najpierw dodawaj nowe pola/tabele, potem kod z nich korzystający, później usuwaj stare pola
- rollback kodu nie może wymagać rollbacku danych w normalnym scenariuszu
- nie łącz dużej migracji danych z dużą zmianą kodu
- feature flag powinien mieć właściciela i termin usunięcia
- deployment powinien mieć smoke test po przejściu przez realny proxy
- metryki po deployu powinny być porównane z baseline
- release powinien dać się zatrzymać i wycofać
- CI/CD powinien publikować kto, co i kiedy wdrożył
## Bezpieczeństwo hosta

Zasady:

- aktualizuj system i kernel w kontrolowanym procesie
- ogranicz SSH do VPN/bastiona/allowlisty
- wyłącz logowanie hasłem, używaj kluczy albo SSO
- używaj firewalli hostowych i sieciowych
- nie uruchamiaj kontenerów privileged bez powodu
- monitoruj dysk, RAM, CPU, load, network, file descriptors
- ustaw log rotation dla Dockera/container runtime
- zabezpiecz `/var/run/docker.sock`
- oddziel hosty control plane od hostów workload, jeśli skala i budżet na to pozwalają
- dokumentuj procedurę wymiany hosta
- przed pracami na hoście Nomad wykonaj drain albo ustaw scheduling eligibility
## IaC, GitOps i drift

Terraform state przechowuje mapowanie zasobów i może zawierać dane wrażliwe, dlatego wymaga kontrolowanego backendu, blokady i kontroli dostępu.[^terraform-state][^terraform-locking]

Zasady:

- infrastruktura powinna być opisana w repozytorium
- zmiany infrastruktury powinny przechodzić review
- state Terraform trzymaj w zdalnym backendzie z lockingiem
- ogranicz dostęp do state
- nie edytuj zasobów ręcznie bez późniejszego odtworzenia zmiany w IaC
- wykrywaj drift
- secrets nie powinny trafiać do state, jeśli da się tego uniknąć
- job specs Nomad traktuj jak kod infrastruktury
- `nomad job plan` powinien być częścią pipeline przed `nomad job run`
- dla środowisk trzymaj parametry jako zmienne, ale nie ukrywaj logiki w zbyt dużej liczbie template'ów
## CI/CD dla infrastruktury i obrazów

Pipeline powinien oddzielać build, test, scan, publish i deploy.

Minimalny pipeline:

```text
lint/test aplikacji
build obrazu
scan obrazu
SBOM/provenance
push do registry
nomad job plan na staging
deploy staging
smoke test przez proxy
manual approval albo policy gate
nomad job plan production
deploy production
metryki po deployu
```

Zasady:

- CI buduje obraz, produkcja go tylko pobiera
- deployment używa konkretnego tagu albo digestu
- deploy produkcji wymaga uprawnień innych niż build PR
- pipeline nie powinien mieć globalnego admin tokena Nomad
- secrets pipeline powinny mieć minimalne scope
- wynik `nomad job plan` powinien być widoczny w review/release
- rollback powinien być jednym znanym procesem
- smoke test powinien przechodzić przez realny routing, TLS i proxy
- migracje danych powinny mieć osobny krok albo jawny etap deploymentu
## Minimalne standardy dla małej produkcji single-host

Dla prostego systemu na jednym serwerze:

- Docker Compose albo systemd z kontenerami
- Traefik/NGINX jako jedyny publiczny entrypoint
- automatyczne certyfikaty ACME
- firewall: publicznie 80/443, SSH ograniczone
- prywatna sieć Dockera dla aplikacji i bazy
- obrazy z registry, bez builda na serwerze
- non-root containers tam, gdzie możliwe
- secrets poza obrazem
- healthchecki i restart policy
- log rotation
- monitoring hosta i aplikacji
- alert na certyfikaty, dysk, RAM, CPU, status usług, backup
- automatyczny backup bazy poza serwer
- test restore minimum okresowo
- opisany rollback
- staging albo przynajmniej środowisko testowe z tym samym routingiem
## Minimalne standardy dla Nomad multi-node

Dla systemu na kilku node'ach:

- 3 albo 5 serwerów Nomad w produkcyjnym regionie
- osobne nody klientów dla workloadów
- Nomad ACL włączone
- Nomad UI/API dostępne tylko przez prywatną sieć, VPN albo zabezpieczony admin ingress
- job specs w repozytorium
- `nomad job plan` przed deployem
- `update`, `restart`, `reschedule`, `migrate` w service jobach
- `resources` w każdym tasku produkcyjnym
- service discovery przez Nomad albo Consul
- health checki service registration
- Traefik/NGINX jako publiczny edge
- TLS/ACME z trwałym storage certyfikatów
- Vault albo Nomad Variables dla sekretów
- centralne logi
- centralne metryki
- alerty na Nomad server quorum, failed deployments, pending allocations, node down, restart loops
- procedura node drain
- test awarii jednego klienta
- test rolling deployment
- backup i restore danych aplikacyjnych
- backup/odtworzenie konfiguracji Nomad/Consul/Vault według przyjętego modelu
- monitoring capacity per node i per service
