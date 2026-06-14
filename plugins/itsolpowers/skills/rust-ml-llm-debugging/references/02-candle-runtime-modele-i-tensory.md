# rust-ml-llm-debugging Reference Sector: Candle: runtime, modele i tensory

## Zawartość

- Candle: runtime, modele i tensory

## Candle: runtime, modele i tensory

Candle jest minimalistycznym frameworkiem ML w Rust. Wspiera trenowanie modeli, user-defined ops/kernels, CPU z MKL/Accelerate, CUDA, NCCL, WASM, safetensors, GGML/GGUF i przykładowe modele. [candle-readme] [candle-book]

### Ładowanie modelu

- model ładuj raz przy starcie procesu albo przy lazy initialization kontrolowanej przez cache
- nie ładuj modelu per request
- tokenizer ładuj razem z modelem i wersjonuj go z wagami
- przed ustawieniem readiness wykonaj warmup inferencji
- jeśli warmup nie przejdzie, proces nie powinien przyjmować requestów
- model artifact powinien mieć manifest: source, revision, checksum, license, dtype, quantization, tokenizer, config
- nie pobieraj modeli z internetu przy każdym starcie produkcji, jeśli możesz przygotować cache albo artifact
- w środowisku produkcyjnym preferuj konkretny revision zamiast `main`
- sprawdzaj checksum plików wag i tokenizerów
- przy dużych wagach rozważ memory mapping safetensors
- nie używaj formatów wymagających pickle dla niezaufanych modeli
- przy migracji modelu trzymaj kompatybilność output schema albo wersjonuj endpoint

### Device i dtype

- device powinien pochodzić z konfiguracji: CPU, CUDA index, Metal/MPS albo auto tylko w środowisku dev
- w produkcji nie rób cichego fallbacku z GPU na CPU bez metryki i logu
- dtype dobieraj do modelu, sprzętu i wymagań jakościowych
- dla inferencji testuj `F16`, `BF16`, `F32` i quantization na eval dataset
- dla treningu sprawdzaj stabilność numeryczną po zmianie dtype
- nie przenoś tensorów między CPU i GPU w hot path bez powodu
- trzymaj tokenizer output i tensory wejściowe na właściwym device możliwie wcześnie
- unikaj konwersji tensorów do `Vec` w hot path, jeśli dalsza praca może zostać na device
- sprawdzaj rozmiar tensorów i batchy przed alokacją
- przy OOM zmniejsz batch size, sequence length, dtype albo użyj quantization
- loguj device, dtype, model id i quantization przy starcie procesu

Przykład jawnego wyboru device:

```rust
use candle_core::Device;

fn select_device(configured: &str) -> candle_core::Result<Device> {
    match configured {
        "cpu" => Ok(Device::Cpu),
        "cuda:0" => Device::new_cuda(0),
        "cuda:1" => Device::new_cuda(1),
        other => candle_core::bail!("unsupported device: {other}"),
    }
}
```

### Tokenizacja

- tokenizer jest częścią model artifact
- nie zakładaj, że dwa modele używają zgodnego tokenizer.json
- limituj długość inputu przed tokenizacją i po tokenizacji
- jawnie ustal truncation, padding i max sequence length
- mierz czas tokenizacji osobno od czasu inferencji
- przy wielu workerach kontroluj liczbę wątków tokenizerów
- nie pobieraj tokenizerów przez HTTP w hot path
- przy danych wielojęzycznych testuj token budget na realnych przykładach
- przy streaming generation nie mieszaj bajtów, tokenów i znaków Unicode

### Inferencja lokalna

- utrzymuj model i tokenizer w strukturze runtime współdzielonej przez serwis
- concurrency ograniczaj semaforem zależnym od VRAM/RAM i batch size
- nie zakładaj, że więcej równoległych requestów zwiększy throughput
- przy LLM rozważ batching, jeśli requesty mają podobne długości i SLA na to pozwala
- przy embedderach batchowanie zwykle daje większy zysk niż równoległość per request
- przy autoregresji używaj KV cache albo gotowego modelu, który go obsługuje
- limituj max new tokens i max context
- obsłuż cancellation, ale sprawdź, czy przerwanie w połowie generacji bezpiecznie zwalnia zasoby
- oddziel prefill latency od decode latency w metrykach
- dla modeli generatywnych zapisuj sampling params w telemetryce
- nie używaj tych samych parametrów sampling dla klasyfikacji, ekstrakcji i kreatywnej generacji

### Trening i fine-tuning

- trening uruchamiaj jako osobny worker albo job, nie w procesie obsługującym requesty API
- konfiguracja treningu powinna być zapisana w pliku versioned config
- zapisuj base model, dataset version, seed, hyperparameters, git sha i wersję kodu
- rozdziel train, validation i test set
- nie trenuj i nie ewaluuj na tym samym zbiorze
- seed ustawiaj jawnie, ale nie zakładaj pełnej deterministyczności na GPU
- checkpointy zapisuj atomowo, np. najpierw do pliku tymczasowego, potem rename
- checkpoint powinien zawierać model state, optimizer state, step, epoch i konfigurację
- zapisuj metryki per step/epoch
- monitoruj loss, validation metric, learning rate, gradient norm i czas kroku
- przy OOM używaj mniejszego batch size, gradient accumulation, mniejszego sequence length albo quantization/LoRA, jeśli pasuje do modelu
- dataset loader powinien obsługiwać przerwanie i wznowienie joba
- dane treningowe z PII wymagają oddzielnej polityki retencji i redakcji
- nie publikuj wag wytrenowanych na danych klienta bez sprawdzenia licencji i zgód

### Artefakty i formaty wag

- preferuj `safetensors` dla wag pobieranych z zewnętrznych źródeł
- unikaj pickle dla niezaufanych modeli, bo ładowanie pickle może wykonać kod
- zapisuj checksum każdego pliku artefaktu
- zapisuj license i model card metadata razem z artefaktem
- zapisuj source repository i revision z Hugging Face
- nie zakładaj, że model z tą samą nazwą ma identyczne wagi po kilku miesiącach
- jeżeli używasz GGUF/GGML, zapisz quantization type i oczekiwaną jakość w eval results
- model registry powinno rozróżniać model base, fine-tune, adapter, quantized variant i tokenizer
- przy wymianie modelu wykonaj smoke test, eval regression i test memory footprint

Safetensors jest formatem zaprojektowanym jako bezpieczniejszy niż pickle i umożliwia szybkie oraz częściowo lazy ładowanie tensorów. Format nie sprawdza jednak semantycznej poprawności wag, np. NaN/Inf, więc artefakt dalej wymaga walidacji i testów. [safetensors]

### Hugging Face Hub

- używaj konkretnego revision albo commit hash
- nie pobieraj z `main` w produkcji bez kontroli
- w CI albo build pipeline pobieraj artefakty i zapisuj manifest
- ustaw cache directory jawnie
- rozdziel cache dev, CI i production
- dostęp do prywatnych modeli dawaj przez token o minimalnych uprawnieniach
- nie zapisuj HF token w obrazie Dockera
- włącz skanowanie licencji i model card review przed użyciem modelu
- sprawdzaj, czy model card opisuje intended use, limitations, training data, eval results i license
- model bez license albo z niejasną licencją nie powinien wejść do produkcji
