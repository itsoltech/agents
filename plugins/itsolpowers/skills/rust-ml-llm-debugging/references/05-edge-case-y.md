# rust-ml-llm-debugging Reference Sector: Edge case'y

## Zawartość

- Edge case'y
- Minimalny zestaw CI

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
