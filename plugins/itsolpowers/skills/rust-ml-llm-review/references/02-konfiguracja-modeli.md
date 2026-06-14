# rust-ml-llm-review Reference Sector: Konfiguracja modeli

## Zawartość

- Konfiguracja modeli

## Konfiguracja modeli

- konfiguracja modelu powinna być typowana i walidowana przy starcie
- nie zapisuj modelu, temperatury, max tokens i providera w wielu miejscach kodu
- trzymaj osobną konfigurację dla use case, a nie tylko globalny default
- w konfiguracji zapisuj provider, model id, revision, temperature, top_p, max tokens, timeout, retry policy, budget i region
- dla modeli lokalnych zapisuj ścieżkę wag, tokenizer, dtype, device, quantization, max context, batch size i warmup policy
- nie rób silent fallback z GPU na CPU w produkcji, jeśli latency ma znaczenie
- jeśli fallback jest dopuszczalny, loguj go jako zdarzenie diagnostyczne
- nie traktuj temperatury jako globalnego ustawienia dla całej aplikacji
- extraction, klasyfikacja i mapowanie danych zwykle powinny mieć niższą temperaturę niż kreatywna generacja
- każdy prompt powinien mieć nazwę, wersję i ownera
- każda zmiana promptu powinna przejść przez eval albo zestaw przykładów regresyjnych

Przykład manifestu artefaktu:

```yaml
model:
  name: bge-small-en-v1.5
  source: huggingface
  repository: BAAI/bge-small-en-v1.5
  revision: 5c38ec7
  files:
    - name: model.safetensors
      sha256: "..."
    - name: tokenizer.json
      sha256: "..."
  license: mit
  dtype: f16
  max_sequence_length: 512
  embedding_dimension: 384
```
