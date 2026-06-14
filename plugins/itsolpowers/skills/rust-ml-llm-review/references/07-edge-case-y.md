# rust-ml-llm-review Reference Sector: Edge case'y

## Zawartość

- Edge case'y
- Checklist do code review
- Minimalny zestaw CI
- Przykładowe reguły merge requestu

## Edge case'y

### Model i provider

- provider zwraca 200 z odpowiedzią w złym formacie
- provider streaming kończy się bez final usage
- provider zmienia zachowanie modelu bez zmiany nazwy
- rate limit występuje dopiero po częściowym streamie
- fallback provider nie obsługuje tych samych tools
- context length różni się między providerami
- model odmawia odpowiedzi mimo poprawnego requestu
- model halucynuje enum albo ID zasobu
- model zwraca JSON z komentarzami albo trailing comma
- model nie wywołuje toola wymaganego przez extractor

### RAG

- dokument należy do innego tenant, ale jest semantycznie najlepszym wynikiem
- dokument został usunięty, ale embedding dalej istnieje
- chunking zmienił się, a stare embeddingi zostały w indeksie
- embedding model zmienił wymiar wektora
- indeks zawiera duplikaty tego samego dokumentu
- dokument zawiera instrukcję typu „ignore previous instructions”
- top-k zwraca wiele prawie identycznych chunków
- brak wyników jest traktowany jak błąd modelu

### Candle runtime

- GPU niedostępne po restarcie drivera
- CUDA version w obrazie nie pasuje do hosta
- model mieści się w VRAM przy jednym requeście, ale nie przy dwóch
- tokenizer pobiera pliki z internetu w produkcji
- fallback CPU powoduje timeouty i kolejkę
- memory-mapped weights działają lokalnie, ale nie na danym filesystemie
- warmup przechodzi, ale długi input powoduje OOM
- quantized model przechodzi smoke test, ale psuje jakość na danych domenowych

### Trening

- checkpoint zapisuje się częściowo i później jest traktowany jako poprawny
- dataset zmienił się pod tą samą nazwą
- eval dataset zawiera przykłady z train set
- seed nie daje identycznego wyniku na innym GPU
- logi treningu zawierają dane klienta
- model został wypromowany bez sprawdzenia license

### Frontend i streaming

- użytkownik zamyka kartę, backend dalej generuje odpowiedź
- WebSocket reconnect duplikuje final event
- stream zwraca część odpowiedzi i błąd
- UI traktuje partial answer jako zapisany wynik
- retry wysyła drugi raz operację mutującą
- final structured output różni się od tekstu streamowanego wcześniej
## Checklist do code review

### Architektura

- czy Rig i Candle są użyte w odpowiednich warstwach?
- czy domena nie zależy bezpośrednio od providera LLM?
- czy trening jest poza procesem API?
- czy lokalna inferencja nie ładuje modelu per request?
- czy provider/model można zmienić przez konfigurację i policy?
- czy prompty, modele, embeddingi i indeksy są wersjonowane?

### Rig

- czy agent ma jeden opisany use case?
- czy agent ma limit kroków, timeout i budżet tokenów?
- czy tools są ograniczone whitelistą?
- czy tool sprawdza autoryzację niezależnie od modelu?
- czy structured output jest walidowany?
- czy streaming obsługuje cancellation i final status?
- czy błędy extractora są obsłużone?
- czy RAG traktuje dokumenty jako niezaufane dane?

### Candle

- czy model i tokenizer są ładowane raz?
- czy device i dtype są jawnie skonfigurowane?
- czy warmup decyduje o readiness?
- czy concurrency jest ograniczona?
- czy input length, batch size i max tokens są limitowane?
- czy safetensors albo inny format wag jest sprawdzony?
- czy artefakt modelu ma manifest i checksum?
- czy OOM jest obsłużony jako błąd operacyjny, a nie losowa panika?

### Bezpieczeństwo

- czy output modelu jest traktowany jako niezaufany?
- czy prompt injection jest testowany?
- czy dane wrażliwe nie trafiają do promptów/logów bez potrzeby?
- czy narzędzia mutujące stan mają audit log i idempotency key?
- czy provider zewnętrzny jest zgodny z polityką danych?
- czy modele zewnętrzne mają license, revision i checksum?
- czy budżety kosztów i tokenów są wymuszane po stronie backendu?

### RAG

- czy retrieval filtruje po tenant i permission?
- czy embedding model i chunker są wersjonowane?
- czy reindex jest zaplanowany po zmianie embeddera albo chunkingu?
- czy usunięcie dokumentu usuwa embeddingi?
- czy top-k, threshold i reranker są testowane na eval set?
- czy odpowiedź z RAG zapisuje użyte źródła?

### Observability

- czy request LLM ma trace id?
- czy metryki rozdzielają retrieval, model, tools i post-processing?
- czy token usage i koszt są mierzone?
- czy pełne prompty są redagowane albo wyłączone w logach?
- czy błędy walidacji outputu trafiają do eval dataset?
- czy alerty obejmują timeouty, rate limit, OOM, queue depth i wzrost kosztów?

### Testy i evals

- czy prompt builder ma testy bez modelu?
- czy tools mają testy autoryzacji?
- czy extraction ma testy na brakujące i błędne pola?
- czy RAG ma testy tenant isolation?
- czy eval dataset jest wersjonowany?
- czy zmiana promptu/modelu uruchamia regresję?
- czy przypadki z produkcji trafiają do evals po redakcji danych?
## Minimalny zestaw CI

Podstawowe kontrole Rust:

```bash
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace --all-features
cargo doc --workspace --all-features --no-deps
cargo deny check
cargo audit
```

Dodatkowe kontrole dla ML / LLM:

```bash
# testy bez zewnętrznych providerów
cargo test --workspace --no-default-features --features test-local

# testy promptów, schema i parserów
cargo test -p app-llm

# evals offline na stałym dataspecie
cargo run -p app-evals -- run --suite regression --offline

# smoke test lokalnego modelu, jeśli artefakt jest dostępny
cargo test -p app-ml-runtime --features local-candle -- --ignored
```

Dla GPU:

```bash
cargo test -p app-ml-runtime --features local-cuda -- --ignored
```

Dla bezpieczeństwa i artefaktów:

```bash
cargo deny check
cargo audit
sha256sum -c models/checksums.txt
```
## Przykładowe reguły merge requestu

- zmiana promptu wymaga aktualizacji prompt version i uruchomienia evals
- zmiana modelu wymaga aktualizacji manifestu i eval regression
- zmiana chunkingu wymaga planu reindex
- zmiana embedding modelu wymaga nowego namespace albo reindex
- dodanie toola wymaga testów autoryzacji i audit logu
- dodanie providera wymaga timeoutów, retry policy, rate limit handling i telemetryki
- dodanie lokalnego modelu wymaga smoke testu, manifestu, checksum i memory budget
- zmiana output schema wymaga wersjonowania kontraktu i migracji klientów
- zmiana logowania promptów wymaga review bezpieczeństwa
