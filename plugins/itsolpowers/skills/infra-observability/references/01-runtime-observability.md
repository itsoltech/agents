# Runtime Observability

Ten plik jest wewnętrzną referencją skilla, wyciętą z `infrastructure-deployment-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj poniższej wiedzy bezpośrednio.

## Zakres

Review obserwowalności: health checki, logs, metrics, traces, SLO, alerty, log cardinality, Nomad metrics i diagnostyka po deployu.

## Przeniesione sekcje

- Health checks
- Nomad - monitoring i diagnostyka
- Observability
- Metryki, SLO i alerting
- Logi i cardinality
- Checklist do review infrastruktury

## Wiedza skilla

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

## Observability

OpenTelemetry opisuje trzy główne sygnały: traces, metrics i logs.[^opentelemetry-signals]

Zasady:

- każda usługa powinna mieć structured logs
- każdy request powinien mieć request id albo trace id
- trace id powinien przechodzić przez proxy, backend, kolejki i workery tam, gdzie to możliwe
- metryki powinny obejmować latency, throughput, errors, saturation
- logi powinny mieć stałe pola: service, env, version, instance/allocation, request id, tenant id jeśli bezpieczne
- nie dodawaj wysokiej cardinality jako label metryk
- nie dodawaj user id, email, request path z ID albo pełnego query jako label Prometheusa
- dashboardy powinny pokazywać aplikację i infrastrukturę razem
- alerty powinny prowadzić do działania, nie tylko informować o stanie
