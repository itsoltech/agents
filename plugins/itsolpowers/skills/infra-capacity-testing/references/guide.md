# infra-capacity-testing Reference

Ten plik jest wewnętrzną referencją skilla, wyciętą z `infrastructure-deployment-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj poniższej wiedzy bezpośrednio.

## Zakres

Planowanie capacity i testów obciążeniowych: CPU/RAM, DB connections, queues, open connections, node drain headroom, autoscaling, LB, WebSocket/SSE i multi-region latency.

## Przeniesione sekcje

- Nomad - zasoby i placement
- Nomad - autoscaling
- Load balancing
- WebSocket, SSE i połączenia długie
- Bazy danych, cache i kolejki
- Capacity planning i testy obciążeniowe
- Multi-region i geografia

## Wiedza skilla

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

## Nomad - autoscaling

Nomad Autoscaler może skalować task group albo klaster na podstawie metryk. Dokumentacja opisuje go jako horizontal application i cluster autoscaler; scaling policies definiują target, strategie i źródła metryk.[^nomad-autoscaler][^nomad-autoscaler-policy]

Zasady:

- skaluj po metryce powiązanej z bottleneckiem
- CPU jest dobre dla usług CPU-bound
- dla API często lepsze są latency, request rate, inflight requests albo queue depth
- dla workerów często lepsza jest długość kolejki i czas oczekiwania joba
- autoscaling nie zastępuje limitów, backpressure i rate limitingu
- ustaw `min` i `max`, żeby uniknąć zejścia do zera albo niekontrolowanego kosztu
- dodaj cooldown/stabilization window, żeby uniknąć flappingu
- testuj scale up i scale down na stagingu
- scaling aplikacji bez capacity bazy/cache może tylko przesunąć problem
- przed cluster autoscalingiem upewnij się, że node drain działa poprawnie

Przykład scaling block:

```hcl
scaling {
  min     = 2
  max     = 10
  enabled = true
}
```

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

## Bazy danych, cache i kolejki

Aplikacje można skalować horyzontalnie tylko do momentu, w którym nie wyczerpią wspólnych zależności.

Zasady DB:

- baza nie powinna być publicznie dostępna z internetu
- migracje uruchamiaj w kontrolowanym miejscu, nie równolegle z każdej repliki aplikacji
- pool połączeń musi być dobrany do liczby replik i limitu DB
- maksymalna liczba połączeń aplikacji nie może przekraczać możliwości bazy
- read replica nie rozwiązuje problemów z transakcjami zapisującymi
- backup i restore są częścią wdrożenia, nie dodatkiem
- monitoruj slow queries, locki, deadlocki, replication lag, connection count, disk usage

Zasady cache:

- cache musi mieć TTL albo limit rozmiaru
- cache invalidation powinno być opisane
- Redis używany jako session store wymaga backup/HA zgodnie z wymaganiami sesji
- nie traktuj cache jako trwałego storage, jeśli nie ma procesu odtworzenia

Zasady kolejek:

- worker musi obsługiwać retry, backoff i dead-letter queue
- job powinien być idempotentny albo mieć deduplikację
- kolejka musi mieć monitoring depth, age of oldest message, retry count i failure rate
- worker powinien reagować na shutdown i kończyć albo bezpiecznie przerywać job
- nie pobieraj z kolejki więcej pracy, niż proces może obsłużyć przed shutdownem

## Capacity planning i testy obciążeniowe

Zasady:

- mierz ruch: RPS, concurrency, open connections, queue depth, payload size
- mierz zasoby: CPU, RAM, disk IO, network, DB connections, cache hit ratio
- testuj osobno API, workery, WebSocket/SSE, uploady, eksporty i zadania batch
- testuj cold start i rolling deployment pod ruchem
- testuj restart jednej instancji i jednego noda
- testuj reconnect storm dla połączeń długich
- testuj zachowanie przy wolnej bazie, wolnym cache i wolnym API zewnętrznym
- capacity Nomad node'ów musi mieć margines na rolling deploy i node drain
- nie planuj klastra na 100% allocatable CPU/RAM
- utrzymuj zapas pozwalający przenieść workload z jednego noda, jeśli wymagana jest dostępność po awarii noda

## Multi-region i geografia

Multi-region zwiększa złożoność. Nie wprowadzaj go bez konkretnego wymagania RTO/latency/compliance.

Zasady:

- określ, czy regiony działają active-active, active-passive czy cold standby
- ustal źródło prawdy dla danych
- rozwiąż konflikty zapisu przed uruchomieniem active-active
- DNS failover powinien być testowany
- certyfikaty i sekrety muszą istnieć w każdym regionie albo być odtwarzalne
- monitoring powinien odróżniać awarię regionu od awarii usługi
- Nomad federation ma własne pojęcie authoritative region dla wybranych obiektów; dokumentacja opisuje replikację ACL policies, roles, namespaces, node pools, quota specifications i Sentinel policies z authoritative region[^nomad-federation]
