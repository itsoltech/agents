# rust-ml-llm-review Reference Sector: Candle: trening, inference service i joby

## Zawartość

- Candle: trening, inference service i joby
- Integracja z frontendem
- Integracja z backendem niezależnym od technologii
- Observability, koszty i audyt
- Testy i ewaluacje
- Deployment i infrastruktura

## Candle: trening, inference service i joby

### Service lokalnej inferencji

- uruchamiaj service z jednym albo kilkoma modelami zależnie od RAM/VRAM
- nie ładuj zbyt wielu modeli do jednego procesu, jeśli powoduje to fragmentację pamięci lub OOM
- per model ustaw semafor concurrency
- readiness powinno zależeć od załadowania modelu i warmup
- liveness nie powinno wykonywać kosztownej inferencji
- expose'uj metryki: queue depth, in-flight, latency, OOM, model load time, warmup time
- zmiana modelu powinna być rolling albo blue-green
- jeżeli model jest duży, unikaj częstego restartu procesu
- kontroluj cache tokenizerów i wag

### Training worker

- training worker powinien działać poza request path
- job treningowy powinien mieć status: queued, running, checkpointing, completed, failed, cancelled
- job powinien zapisywać artefakty do versioned storage
- po awarii job powinien wznowić z checkpointu albo oznaczyć się jako failed bez uszkodzonego artefaktu
- logi treningu powinny nie zawierać danych wrażliwych z datasetu
- dataset powinien mieć manifest i checksum
- metryki treningu powinny być powiązane z dataset version i model version
- deployment wytrenowanego modelu powinien wymagać osobnego kroku promocji
## Integracja z frontendem

- frontend nie powinien znać nazw providerów ani sekretów
- frontend powinien wysyłać use case i input, a backend wybiera model policy
- streaming najlepiej traktować jako osobny kontrakt: event type, sequence, payload, final status
- partial response nie jest finalnym sukcesem
- UI musi obsłużyć cancellation, timeout, partial failure i retry
- jeśli odpowiedź jest structured, UI powinien bazować na zwalidowanym final event, nie na fragmentach streamu
- przy optimistic UI dla akcji LLM oznacz stan jako pending, dopóki backend nie potwierdzi finalnego wyniku
- nie zapisuj promptów i odpowiedzi z danymi wrażliwymi w localStorage
- przy cache frontendu invalidację opieraj na zdarzeniach domenowych, nie na treści odpowiedzi modelu
## Integracja z backendem niezależnym od technologii

Backend może być napisany w Rust, Effect albo innym stacku. Wspólne powinny pozostać kontrakty:

- `POST /llm/{use_case}` dla request-response
- `POST /llm/{use_case}/stream` albo SSE/WebSocket dla streamingu
- `POST /documents` dla ingestion
- `POST /indexes/{name}/rebuild` dla reindex
- `POST /evals/{suite}/run` dla ewaluacji
- `GET /models` dla listy profili dostępnych w danym środowisku
- `GET /jobs/{id}` dla statusu długich operacji

Zasady:

- kontrakty opisuj przez OpenAPI albo inny format schema
- błędy mapuj do stabilnych kodów aplikacyjnych
- nie wystawiaj wewnętrznych błędów providera jako publicznego API
- idempotency key stosuj dla długich lub mutujących operacji
- request id przekazuj przez wszystkie warstwy
- wersjonuj output schema dla extraction i classification
- nie pozwalaj klientowi wybrać dowolnego modelu, jeśli nie ma do tego uprawnień
## Observability, koszty i audyt

### Metryki

Mierz osobno:

- request count per use case, tenant, provider i model
- latency total
- latency prompt build
- latency retrieval
- latency embedding
- latency provider/model
- latency tool calls
- tokens input/output
- koszt estymowany
- retry count
- timeout count
- rate limit count
- model validation errors
- extractor deserialization errors
- RAG no-result count
- queue depth
- local model memory usage
- GPU memory usage
- batch size
- OOM count

### Logi i trace

- każdy request powinien mieć trace id
- logi powinny mieć use case, model profile, provider, prompt version i tenant id
- pełne prompty loguj tylko w bezpiecznym trybie diagnostycznym
- dane wrażliwe redaguj przed eksportem
- tool calls loguj z nazwą toola i statusem, ale ostrożnie z argumentami
- błędy walidacji outputu zapisuj z nazwą schema i wersją
- przy provider fallback zapisz źródłowy błąd i provider docelowy

### Audyt

- akcje mutujące wykonane przez tools zapisuj w audit logu
- audit log powinien zawierać user, tenant, tool, resource id, timestamp, request id i wynik
- nie zapisuj sekretów w audit logu
- dla decyzji wysokiego ryzyka zapisuj input summary, model version, prompt version i evidence
- audyt nie powinien zależeć od tego, czy odpowiedź modelu była poprawna
## Testy i ewaluacje

### Testy jednostkowe

- prompt builder testuj bez wywołania modelu
- walidację outputu testuj na przykładach poprawnych i błędnych
- tool authorization testuj bez modelu
- mapping błędów providera testuj deterministycznie
- chunking testuj snapshotem albo golden outputem
- retrieval filters testuj na danych z kilkoma tenantami
- model policy testuj jako zwykłą logikę

### Testy integracyjne

- wywołania providerów oznacz jako ignored albo osobną feature flagą
- testy z lokalnym modelem uruchamiaj na małym modelu testowym
- testy z GPU nie powinny blokować podstawowego CI, jeśli GPU nie jest dostępne
- testuj timeout, cancellation i partial stream failure
- testuj provider rate limit i retry przez mock server
- testuj niepoprawny JSON z modelu
- testuj RAG bez wyników
- testuj za długi input

### Evals

- eval dataset trzymaj w repo albo versioned storage
- każdy eval case powinien mieć expected behavior, a nie tylko expected text
- extraction oceniaj per field
- classification oceniaj przez confusion matrix albo per label checks
- RAG oceniaj retrieval i final answer osobno
- generację oceniaj przez zestaw kryteriów i przykłady negatywne
- wyniki eval zapisuj z modelem, prompt version, providerem i git sha
- eval uruchamiaj przy zmianie promptu, modelu, retrievera, chunkingu i tooli
- błędy z produkcji dodawaj do eval dataset po redakcji danych wrażliwych
## Deployment i infrastruktura

- modele i wagi traktuj jak artefakty deploymentu
- nie pobieraj dużych modeli z internetu przy każdym starcie, jeśli możesz użyć lokalnego cache lub registry
- obrazy Dockerowe z modelami są duże; rozważ osobny volume/cache dla wag
- readiness powinno czekać na załadowanie modelu i warmup
- liveness nie powinno odpalać inferencji
- przy GPU service planuj node placement, device allocation i limity zasobów
- w Nomad opisuj wymagania GPU/CPU/RAM w job spec
- nie współdziel GPU bez limitów między procesami, jeśli model może zająć całą VRAM
- kontroluj rolling update, żeby nie usunąć wszystkich warm modeli jednocześnie
- blue-green deployment jest bezpieczniejszy przy dużej zmianie modelu albo promptu
- przechowuj model cache per node albo per volume zależnie od czasu startu i storage
- alertuj na model load failure i warmup failure
- przy zewnętrznych providerach monitoruj region, status API, rate limit i koszt
- przy local inference monitoruj temperaturę GPU, memory fragmentation i OOM
- backupuj model registry, eval results, dataset metadata i indeksy, jeśli ich odbudowa jest kosztowna
