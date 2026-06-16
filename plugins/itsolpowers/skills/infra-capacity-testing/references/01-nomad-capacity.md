# Nomad Capacity

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
