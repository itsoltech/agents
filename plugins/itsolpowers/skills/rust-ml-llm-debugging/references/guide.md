# rust-ml-llm-debugging Reference Index

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `rust-ml-llm-rig-candle-code-review-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Rust ML LLM debugging

## Przeniesione sekcje

- Rig: providerzy, modele i agenci
- Candle: runtime, modele i tensory
- API dla funkcji ML / LLM
- Bezpieczeństwo aplikacji LLM
- RAG: ingestion, indexing i retrieval
- Candle: trening, inference service i joby
- Integracja z frontendem
- Observability, koszty i audyt
- Testy i ewaluacje
- Deployment i infrastruktura
- Edge case'y
- Minimalny zestaw CI

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Pliki referencyjne

- [Shared Rig providers, models, and agents](../../_shared/references/rust-ml-llm/rig-providers-models-agents.md) (170 linii) - wspólne fakty; rozpocznij od lokalnego [debugging wrapper](01-overview.md)
- [Shared Candle runtime and tensors](../../_shared/references/rust-ml-llm/candle-runtime-tensors.md) (123 linii) - wspólne fakty; w debugowaniu izoluj device, dtype, tokenizację, artefakt i inferencję
- [Shared ML/LLM function API](../../_shared/references/rust-ml-llm/function-api.md) (182 linii) - wspólne fakty; w debugowaniu rozdziel kontrakt, provider, safety, retrieval i output
- `04-candle-trening-inference-service-i-joby.md` (140 linii) - Candle: trening, inference service i joby; Integracja z frontendem; Observability, koszty i audyt; Testy i ewaluacje; +1 więcej
- `05-edge-case-y.md` (103 linii) - Edge case'y; Minimalny zestaw CI
