# infra-nomad-deployment Reference Sector: Overview

## Zawartość

- Overview
- Nomad - rola w architekturze
- Nomad - podstawowy model pojęć
- Nomad - standard job speca
- Nomad - zasoby i placement


## Nomad - rola w architekturze

Nomad jest schedulerem workloadów. Nie zastępuje reverse proxy, registry, bazy danych, backupów ani obserwowalności. Jego zadaniem jest przyjęcie deklaratywnego job speca, zaplanowanie alokacji na klientach, kontrola restartów, reschedule, deploymentów, service registrations i integracji z Consul/Vault.

Nomad production reference architecture opisuje typowy klaster jako 3 albo 5 serwerów oraz grupę klientów wykonujących workloady. Nomad używa Raft dla serwerów, a quorum wymaga większości peerów.[^nomad-reference-architecture][^nomad-consensus]

Zasady:

- uruchamiaj serwery Nomad na oddzielonych hostach albo failure domains
- dla produkcji używaj 3 albo 5 serwerów, nie 2
- klienci Nomad powinni być wymienialni
- workloads uruchamiaj na klientach, nie na serwerach, chyba że jest to świadomie mała instalacja
- dane Nomad serverów traktuj jako część infrastruktury, którą trzeba backupować zgodnie z procedurą
- wszystkie job specs trzymaj w repozytorium
- deployment joba powinien być wykonywany przez CI/CD albo kontrolowany operator process, nie ręcznie z laptopa bez historii
- dostęp do Nomad UI/API zabezpiecz ACL, TLS, VPN albo prywatną siecią
- włącz metryki i monitoruj serwery oraz klientów
## Nomad - podstawowy model pojęć

Nomad modeluje workload jako job.

Najczęstsze elementy:

- `job` - deklaracja workloadu
- `group` - grupa tasków uruchamianych razem na tym samym kliencie
- `task` - pojedynczy proces/kontener
- `allocation` - konkretne uruchomienie group na konkretnym kliencie
- `evaluation` - decyzja schedulera po zmianie stanu albo joba
- `deployment` - proces wdrożenia wersji service joba
- `service` - rejestracja usługi w Nomad albo Consul service discovery
- `check` - health check usługi

Nomad job może mieć typ `service`, `batch`, `system` albo `sysbatch`; typ wpływa na scheduler i zachowanie workloadu.[^nomad-job]

Zasady:

- API, frontend SSR i długodziałające workery definiuj zwykle jako `type = "service"`
- joby jednorazowe i importy danych definiuj jako `batch`
- agenty per-node, log shippery, node-exportery albo proxy per-node definiuj jako `system`
- nie wrzucaj wielu niezależnych aplikacji do jednego task group tylko dlatego, że łatwiej je odpalić razem
- taski w jednej group współdzielą placement i lifecycle, więc awaria albo deploy group dotyczy całości
- sidecar w group ma sens, gdy potrzebuje lokalnej sieci, filesystemu albo lifecycle razem z aplikacją
## Nomad - standard job speca

Każdy produkcyjny job spec powinien mieć jawnie opisane:

- `region`, jeśli używacie wielu regionów
- `datacenters`
- `namespace`, jeśli używacie separacji środowisk albo zespołów
- `node_pool`, jeśli macie różne klasy nodów
- `type`
- `group.count` albo `scaling`
- `network` i porty nazwane
- `resources`
- `service` i `check`, jeśli usługa ma być routowana albo odkrywana
- `update`
- `restart`
- `reschedule`
- `migrate`, jeśli job ma więcej niż jedną alokację i ma obsługiwać drain
- `template` dla konfiguracji generowanej w runtime
- `vault`, `identity` albo `nomad variables`, jeśli task potrzebuje sekretów

Przykładowy service job:

```hcl
job "api" {
  datacenters = ["dc1"]
  namespace   = "production"
  node_pool   = "default"
  type        = "service"

  update {
    max_parallel      = 1
    min_healthy_time  = "15s"
    healthy_deadline  = "3m"
    progress_deadline = "10m"
    auto_revert       = true
  }

  group "api" {
    count = 3

    network {
      mode = "bridge"
      port "http" {
        to = 8080
      }
    }

    restart {
      attempts = 3
      interval = "5m"
      delay    = "15s"
      mode     = "fail"
    }

    reschedule {
      attempts       = 5
      interval       = "30m"
      delay          = "30s"
      delay_function = "exponential"
      max_delay      = "5m"
      unlimited      = false
    }

    migrate {
      max_parallel     = 1
      health_check     = "checks"
      min_healthy_time = "15s"
      healthy_deadline = "3m"
    }

    task "api" {
      driver = "docker"

      config {
        image = "registry.example.com/app/api:1.12.3"
        ports = ["http"]
      }

      env {
        APP_ENV = "production"
      }

      resources {
        cpu    = 500
        memory = 512
      }

      service {
        name = "api"
        port = "http"
        tags = [
          "traefik.enable=true",
          "traefik.http.routers.api.rule=Host(`api.example.com`)",
          "traefik.http.routers.api.entrypoints=websecure",
          "traefik.http.routers.api.tls=true"
        ]

        check {
          name     = "ready"
          type     = "http"
          path     = "/health/ready"
          interval = "10s"
          timeout  = "2s"
        }
      }
    }
  }
}
```
## Nomad - zasoby i placement

Nomad resources block opisuje CPU, memory i inne wymagania taska.[^nomad-resources]

Zasady:

- ustaw `resources` dla każdego produkcyjnego taska
- nie dawaj wszystkim usługom identycznych limitów
- osobno profiluj API latency-sensitive, worker CPU-bound, worker memory-heavy i procesy batch
- memory ustawiaj na podstawie realnego working setu i marginesu
- jeśli task bywa zabijany przez OOM, nie zwiększaj limitu bez sprawdzenia alokacji i leaków
- CPU ustawiaj na podstawie realnego profilu, nie liczby rdzeni hosta
- używaj `constraint`, gdy workload wymaga konkretnej architektury, dysku, GPU, sieci albo klasy hosta
- używaj `affinity`, gdy workload preferuje konkretny typ hosta, ale nie musi go dostać[^nomad-affinity]
- używaj `spread`, żeby rozłożyć alokacje po datacenter, AZ, racku albo własnym meta-atrybucie nodów[^nomad-spread]
- unikaj zbyt ostrych constraintów, które powodują brak miejsca dla schedulera
- sprawdzaj pending allocations i powód braku placementu przed zwiększaniem klastra
- w multi-node rozdzielaj repliki usług po różnych klientach, jeśli dostępność ma znaczenie

Przykład spread:

```hcl
spread {
  attribute = "${node.datacenter}"
  weight    = 100
}
```
