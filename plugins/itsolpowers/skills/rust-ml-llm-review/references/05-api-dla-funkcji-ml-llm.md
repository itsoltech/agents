# rust-ml-llm-review Reference Sector: API dla funkcji ML / LLM

## Zawartość

- API dla funkcji ML / LLM
- Bezpieczeństwo aplikacji LLM
- RAG: ingestion, indexing i retrieval

## API dla funkcji ML / LLM

### Kontrakt requestu

Każdy endpoint LLM powinien mieć jawny kontrakt:

- use case name
- input typed DTO
- tenant/user context z auth layer
- request id / correlation id
- timeout albo deadline
- idempotency key dla operacji mutujących stan
- model policy albo model profile, nie bezpośredni dowolny model od klienta
- max input size
- max output size
- stream enabled/disabled

Przykład DTO koncepcyjnego:

```rust
#[derive(Debug, Clone, serde::Deserialize)]
pub struct LlmRequest<T> {
    pub request_id: RequestId,
    pub tenant_id: TenantId,
    pub user_id: UserId,
    pub use_case: UseCase,
    pub input: T,
    pub stream: bool,
    pub deadline_ms: Option<u64>,
}
```

### Kontrakt odpowiedzi

- odpowiedź powinna mieć schema version
- odpowiedź powinna zawierać status: success, partial, validation_error, model_error, timeout
- structured output powinien być walidowany przed wysłaniem jako sukces
- przy streamingu final event powinien zawierać usage i status końcowy
- błędy providerów nie powinny wyciekać jako surowe komunikaty do klienta
- odpowiedź powinna rozróżniać brak danych od błędu modelu
- jeśli odpowiedź opiera się na RAG, zwracaj source references, jeśli produkt tego wymaga

### Timeouty, retry i cancellation

- każdy request do providera albo lokalnego runtime powinien mieć timeout
- retry stosuj tylko dla błędów chwilowych: rate limit, 5xx, network, timeout zależnie od use case
- nie retryuj błędów walidacji, autoryzacji i context too long
- retry musi mieć limit i backoff
- retry musi brać pod uwagę budżet tokenów i koszt
- cancellation klienta powinien przerwać dalszą generację, jeśli to możliwe
- długi job powinien mieć możliwość wznowienia albo bezpiecznego przerwania
- przy mutujących tools retry musi być idempotentny

### Rate limiting i budżety

- limituj requesty per tenant, user, IP, API key i use case
- limituj tokeny wejściowe i wyjściowe
- limituj liczbę tool calls
- limituj liczbę dokumentów RAG
- limituj długość historii rozmowy
- limituj rozmiar uploadu dokumentu
- limituj concurrency per tenant i globalnie
- budżet kosztów powinien być częścią policy, nie logiką UI
- po przekroczeniu budżetu zwracaj jawny błąd, nie degraduj cicho jakości modelu
## Bezpieczeństwo aplikacji LLM

OWASP LLM Top 10 wymienia między innymi prompt injection, sensitive information disclosure, supply chain, data/model poisoning, improper output handling, excessive agency, system prompt leakage, vector/embedding weaknesses, misinformation i unbounded consumption. [owasp-llm]

### Prompt injection

- traktuj input użytkownika jako niezaufany
- traktuj dokumenty RAG jako niezaufane
- traktuj historię rozmowy jako niezaufaną
- nie pozwalaj treści użytkownika nadpisywać instrukcji systemowych
- oddziel instrukcje od danych przez formatowanie, sekcje albo JSON
- testuj prompt injection na zestawie przypadków regresyjnych
- narzędzia muszą mieć własną autoryzację niezależną od promptu
- decyzje typu delete, transfer, send email, grant access nie mogą opierać się wyłącznie na odpowiedzi modelu

### Sensitive data

- nie wysyłaj danych wrażliwych do zewnętrznego providera bez zgody i podstawy prawnej
- redaguj dane, których model nie potrzebuje
- nie loguj promptów zawierających dane osobowe, sekrety, tokeny, dane finansowe albo dane klientów
- nie wkładaj sekretów do system promptu
- system prompt może wyciec przez odpowiedź modelu
- przy providerach zewnętrznych sprawdź retencję danych, region i warunki przetwarzania
- przy lokalnych modelach nadal obowiązuje retencja logów, cache i eval datasets

### Output handling

- output modelu jest niezaufanym wejściem
- waliduj JSON, enumy, URL, ścieżki plików, SQL fragments, markdown i HTML
- nie renderuj HTML wygenerowanego przez model bez sanitizacji
- nie wykonuj kodu wygenerowanego przez model bez sandboxa
- nie używaj modelu jako jedynego walidatora danych
- przy generowaniu SQL używaj query buildera i parametrów, nie surowego SQL z modelu
- przy generowaniu komend shell nie wykonuj ich automatycznie
- przy generowaniu emaili, wiadomości i dokumentów rozróżnij draft od wysłania

### Excessive agency

- agent powinien mieć minimalny zestaw tools
- narzędzia mutujące stan wymagają oddzielnych permission checks
- liczba kroków agenta musi mieć limit
- agent nie może sam zwiększać swojego budżetu
- agent nie może sam dodawać sobie tools
- agent nie może omijać workflow approval
- działania wysokiego ryzyka wymagają confirm step albo human review
- audit log powinien zapisać, który tool został wywołany, z jakimi parametrami i przez kogo

### Supply chain modeli

- używaj safetensors dla niezaufanych wag
- unikaj pickle dla modeli z internetu
- pinuj revision modeli
- zapisuj checksum artefaktów
- sprawdzaj model card i license
- sprawdzaj, czy model jest base, fine-tune, adapter czy quantized variant
- nie ufaj automatycznie custom code z repo modelu
- skanuj artefakty w pipeline
- oddziel modele eksperymentalne od modeli produkcyjnych

### Vector store i embedding weaknesses

- embeddingi mogą ujawniać informacje o danych źródłowych
- indeks wektorowy musi mieć tenant isolation
- usunięcie dokumentu musi usuwać albo unieważniać embeddingi
- dokumenty z ograniczonym dostępem muszą mieć metadata filtrujące permission
- nie używaj globalnego top-k bez filtrów tenant/user
- testuj retrieval poisoning, czyli dokumenty próbujące wymusić instrukcje na modelu
- versionuj embedding model i chunking
- po zmianie embeddera przebuduj indeks albo trzymaj osobny namespace

### Unbounded consumption

- limity kosztu, czasu, tokenów i concurrency muszą działać po stronie backendu
- frontend nie jest warstwą egzekwowania budżetu
- streaming też musi mieć limit
- tool calls też muszą mieć limit
- retries też muszą mieć limit
- provider fallback nie może tworzyć pętli bez końca
- requesty o zbyt dużym input powinny być odrzucane przed wywołaniem modelu
## RAG: ingestion, indexing i retrieval

### Ingestion

- każdy dokument ma mieć ID, tenant, source, version, checksum, created_at, updated_at
- parser powinien zapisywać warnings i błędy ekstrakcji
- chunker powinien być deterministyczny dla tego samego inputu i wersji
- chunk powinien mieć source span, page number albo offset, jeśli dokument to umożliwia
- dane wejściowe powinny być sanityzowane przed indeksowaniem
- prompt injection w dokumencie nie powinien blokować ingestion, ale powinien być traktowany jako zwykły tekst
- ingestion job powinien być idempotentny
- ponowne przetworzenie tego samego dokumentu nie powinno tworzyć duplikatów aktywnych chunków

### Embedding

- batchuj embedding requests, jeśli provider albo lokalny model na tym zyskuje
- embeddingi generuj tym samym modelem dla całego namespace
- zapisuj dimension i model version
- sprawdzaj, czy vector store odrzuca wektor o złej długości
- nie mieszaj języków i domen bez testów jakości retrieval
- metryki embedding latency i kosztu zapisuj osobno

### Retrieval

- retrieval powinien mieć testy na tenant isolation
- najpierw filtruj po tenant i permission, potem szukaj semantycznie, jeśli vector store na to pozwala
- jeżeli vector store najpierw wyszukuje globalnie, a potem filtruje, sprawdź ryzyko wycieku i spadku jakości
- threshold, top-k i reranking ustawiaj per use case
- przy braku dobrych wyników model powinien umieć powiedzieć, że nie ma wystarczających danych
- odpowiedź powinna odróżniać brak dokumentów od błędu retrievera
- źródła użyte w odpowiedzi zapisuj do telemetryki
