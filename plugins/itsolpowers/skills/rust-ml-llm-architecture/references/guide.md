# rust-ml-llm-architecture Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `rust-ml-llm-rig-candle-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Rust ML LLM architecture

## Przeniesione sekcje

- Cel dokumentu
- Założenia architektoniczne
- Decyzja: Rig, Candle czy oba
- Warstwy systemu
- Struktura projektu
- Cargo, features i wersje
- Konfiguracja modeli
- Rig: providerzy, modele i agenci
- Candle: runtime, modele i tensory
- API dla funkcji ML / LLM
- Bezpieczeństwo aplikacji LLM
- RAG: ingestion, indexing i retrieval
- Candle: trening, inference service i joby
- Integracja z frontendem
- Integracja z backendem niezależnym od technologii
- Observability, koszty i audyt
- Testy i ewaluacje
- Deployment i infrastruktura
- Edge case'y

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (177 linii) - Overview; Cel dokumentu; Założenia architektoniczne; Decyzja: Rig, Candle czy oba; +3 więcej
- [Shared model configuration](../../_shared/references/rust-ml-llm/model-configuration.md) (38 linii) - wspólne fakty dla decyzji architektonicznych
- [Shared Rig providers, models, and agents](../../_shared/references/rust-ml-llm/rig-providers-models-agents.md) (170 linii) - wspólne fakty dla projektowania orkiestracji
- [Shared Candle runtime and tensors](../../_shared/references/rust-ml-llm/candle-runtime-tensors.md) (123 linii) - wspólne fakty dla projektowania runtime
- [Shared ML/LLM function API](../../_shared/references/rust-ml-llm/function-api.md) (182 linii) - wspólne fakty dla API, bezpieczeństwa i RAG
- [Shared Candle training, inference, and jobs](../../_shared/references/rust-ml-llm/candle-training-inference-jobs.md) (162 linii) - wspólne fakty dla usług, integracji, observability, testów i deploymentu
- `07-edge-case-y.md` (60 linii) - Edge case'y
