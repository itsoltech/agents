# rust-ml-llm-review Reference Sector: Overview

## Zawartość

- Overview
- Założenia architektoniczne
- Decyzja: Rig, Candle czy oba
- Warstwy systemu
- Struktura projektu
- Cargo, features i wersje


## Założenia architektoniczne

- Rig służy do budowania aplikacji LLM: provider clients, completion models, embedding models, agents, tools, extractors, streaming, RAG i vector stores. [rig-docs]
- Candle służy do pracy z modelami lokalnymi: tensory, modele, inferencja, trening, CUDA, Metal/MPS, MKL, Accelerate, WASM, safetensors, GGML/GGUF i integracja z ekosystemem Hugging Face. [candle-readme] [candle-book]
- Rig i Candle nie muszą znajdować się w tym samym procesie. W aplikacji produkcyjnej często lepszy jest podział na API, inference service, indexing worker, training worker i evaluation worker.
- Kod aplikacyjny nie powinien zależeć bezpośrednio od konkretnego providera LLM. Provider powinien być szczegółem infrastruktury albo konfiguracji.
- Prompty, narzędzia, modele, embeddingi, dane treningowe i indeksy wektorowe muszą mieć wersje.
- Output modelu jest niezaufanym wejściem. Trzeba go walidować tak samo jak dane od użytkownika.
- RAG nie jest mechanizmem bezpieczeństwa. Dokumenty pobrane z indeksu mogą zawierać prompt injection.
- Cache, rate limit, budżet tokenów, timeouty i cancellation są częścią architektury, a nie dodatkiem.
- Każdy request LLM powinien mieć trace id, tenant id albo równoważny kontekst diagnostyczny.
## Decyzja: Rig, Candle czy oba

### Użyj Rig, gdy

- aplikacja korzysta z providerów LLM przez API
- potrzebujesz agentów, tools, structured output, extractors albo RAG
- chcesz mieć wspólne abstrakcje dla wielu providerów
- potrzebujesz streaming completions i obsługi tool calli
- aplikacja ma wymieniać model lub providera bez przepisywania logiki domenowej
- chcesz podłączyć vector store przez gotową integrację albo własną implementację `VectorStoreIndex`
- chcesz implementować ewaluacje odpowiedzi, LLM-as-judge albo metryki semantyczne
- chcesz używać `tracing` i OpenTelemetry GenAI semantic conventions w warstwie LLM

### Użyj Candle, gdy

- model ma działać lokalnie, bez zewnętrznego API
- potrzebujesz kontroli nad device, dtype, batch size, alokacjami i wagami
- wykonujesz inferencję z modeli z Hugging Face
- trenujesz lub fine-tunujesz modele w Rust
- chcesz pisać własne warstwy, operatory, kernely albo pipeline ML
- potrzebujesz kwantyzacji, safetensors, GGUF/GGML albo pracy offline
- chcesz uruchamiać model na CPU, CUDA, Metal/MPS, MKL, Accelerate albo WASM

### Użyj obu, gdy

- Rig odpowiada za orkiestrację agentów, tools, RAG i prompt flow
- Candle odpowiada za lokalny embedding model, reranker, klasyfikator, ekstraktor albo lokalny LLM
- lokalny model z Candle jest wystawiony jako osobny service, a Rig korzysta z niego przez własny adapter
- chcesz zachować wspólną warstwę aplikacyjną, ale mieć kilka backendów inferencji: OpenAI, Anthropic, Gemini, lokalny Candle, vLLM, Ollama albo własny endpoint

### Nie mieszaj warstw bez potrzeby

- nie wkładaj treningu, indeksowania, obsługi requestów HTTP i agent loopa do jednego modułu
- nie ładuj wag modelu per request
- nie twórz klienta providera per request, jeśli może być współdzielony
- nie używaj agentów do deterministycznej logiki, którą da się napisać zwykłym kodem
- nie używaj lokalnego modelu z Candle tylko dlatego, że jest lokalny; porównaj koszt, latency, jakość, pamięć, GPU i utrzymanie
- nie wysyłaj danych do providera zewnętrznego, jeśli polityka bezpieczeństwa lub kontrakt z klientem tego zabrania
## Warstwy systemu

Docelowy system ML / LLM powinien mieć jasne granice:

```text
frontend / API client
        |
HTTP / WebSocket / queue contract
        |
application service
        |
LLM orchestration layer       ML runtime layer
Rig agents / tools / RAG      Candle models / tensors / training
        |                     |
providers / vector stores     weights / tokenizers / datasets
        |                     |
observability / audit / cost / security / evaluation
```

### Warstwa aplikacyjna

- przyjmuje requesty użytkownika i waliduje input
- wybiera use case, model policy, tenant policy i budżet
- kontroluje timeouty, retry, cancellation i concurrency
- mapuje błędy modelu na błędy domenowe albo HTTP
- nie zawiera promptów jako przypadkowych stringów rozsianych po kodzie
- nie zna szczegółów providerów, jeśli nie musi

### Warstwa LLM orchestration

- buduje prompt i kontekst
- wywołuje Rig agent, model, extractor albo embeddings
- wybiera tools dostępne dla danego use case
- ogranicza liczbę kroków agenta
- waliduje structured output
- zapisuje telemetrykę: model, latency, token usage, tool calls, błędy, retry

### Warstwa ML runtime

- ładuje model, tokenizer i konfigurację
- zarządza device, dtype, pamięcią i batchowaniem
- wykonuje inferencję albo trening
- zapisuje checkpointy, metryki i artefakty
- nie zna szczegółów HTTP ani UI

### Warstwa danych

- przechowuje dokumenty, chunk metadata, embeddingi, indeksy, dataset version, model registry, eval results
- wymusza tenant isolation
- przechowuje wersję embedding modelu przy każdym wektorze
- pozwala przebudować indeks po zmianie chunkingu, embeddera albo filtrów
## Struktura projektu

Przykładowy workspace:

```text
crates/
  app-api/                  # HTTP, auth, routing, DTO, OpenAPI
  app-domain/               # typy domenowe, use case contracts, errors
  app-llm/                  # Rig agents, prompts, tools, policies
  app-ml-runtime/           # Candle runtime, model loading, inference
  app-rag/                  # chunking, retrieval, embedding, indexing
  app-evals/                # eval datasets, scoring, regression tests
  app-observability/        # tracing, metrics, cost tracking
  app-config/               # typed config
  app-workers/              # indexing/training/evaluation jobs
```

Zasady:

- domena nie importuje Rig ani Candle, jeśli można tego uniknąć
- moduł LLM nie powinien importować adaptera HTTP
- moduł Candle runtime nie powinien importować bazy aplikacyjnej bez potrzeby
- prompts, schemas i eval cases trzymaj w repo razem z wersją aplikacji
- modele, wagi i duże datasety trzymaj poza repo, z manifestem wersji i checksum
- generowane artefakty, np. indeksy, trzymaj jako artefakty deploymentu albo dane runtime
- każdy crate powinien mieć ograniczony zestaw features
- testy domenowe powinny działać bez modelu i bez sieci
- testy integracyjne z providerem powinny być oznaczone feature flagą albo ignored
## Cargo, features i wersje

- pinuj wersje bibliotek ML / LLM bardziej konserwatywnie niż typowe biblioteki aplikacyjne
- aktualizuj Rig i Candle przez osobny pull request z testami regresyjnymi
- nie używaj floating branch dependency w produkcji
- commituj `Cargo.lock` dla binarek i usług
- używaj `rust-toolchain.toml`, jeśli build ma być powtarzalny
- rozdziel features dla providerów, GPU, evals, loaders i eksperymentalnych integracji
- nie włączaj wszystkich providerów Rig, jeśli aplikacja używa jednego albo dwóch
- nie włączaj CUDA, MKL, Accelerate, loaders i formatów wag bez potrzeby
- dokumentuj wymagania systemowe: CUDA version, driver, libc, CPU features, RAM, VRAM
- jeśli targetujesz kontener, sprawdź TLS backend zależności pobierających modele, np. `hf-hub` może korzystać z rustls albo native-tls
- jeśli używasz `tokenizers` z pobieraniem z Hugging Face, włącz HTTP feature świadomie
- jeśli tokenizacja używa Rayon, ustaw limity wątków w środowisku, gdy proces ma wiele workerów

Przykład features:

```toml
[features]
default = ["provider-openai"]
provider-openai = ["rig-core"]
provider-anthropic = ["rig-core"]
local-candle = ["candle-core", "candle-nn", "candle-transformers"]
local-cuda = ["local-candle", "candle-core/cuda"]
evals = ["rig-core/experimental"]
loaders-pdf = ["rig-core/pdf"]
```

Nie kopiuj tego przykładu bez sprawdzenia faktycznych nazw features w używanej wersji. Nazwy features w bibliotekach ML potrafią zmieniać się między wersjami.
