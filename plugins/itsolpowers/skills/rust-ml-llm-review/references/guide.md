# rust-ml-llm-review Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `rust-ml-llm-rig-candle-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Rust ML LLM review

## Przeniesione sekcje

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
- Checklist do code review
- Minimalny zestaw CI
- Przykładowe reguły merge requestu

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- `01-overview.md` (169 linii) - Overview; Założenia architektoniczne; Decyzja: Rig, Candle czy oba; Warstwy systemu; +2 więcej
- [Shared model configuration](../../_shared/references/rust-ml-llm/model-configuration.md) (38 linii) - wspólne fakty; oceń diff według review flow
- [Shared Rig providers, models, and agents](../../_shared/references/rust-ml-llm/rig-providers-models-agents.md) (170 linii) - wspólne fakty; użyj ich jako review rubryku orkiestracji
- [Shared Candle runtime and tensors](../../_shared/references/rust-ml-llm/candle-runtime-tensors.md) (123 linii) - wspólne fakty; użyj ich jako review rubryku runtime
- [Shared ML/LLM function API](../../_shared/references/rust-ml-llm/function-api.md) (182 linii) - wspólne fakty; użyj ich jako review rubryku API, safety i RAG
- [Shared Candle training, inference, and jobs](../../_shared/references/rust-ml-llm/candle-training-inference-jobs.md) (162 linii) - wspólne fakty; użyj ich jako review rubryku usług, testów i deploymentu
- `07-edge-case-y.md` (186 linii) - Edge case'y; Checklist do code review; Minimalny zestaw CI; Przykładowe reguły merge requestu
