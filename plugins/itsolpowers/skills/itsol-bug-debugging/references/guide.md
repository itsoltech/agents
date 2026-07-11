# itsol-bug-debugging Reference Index

Apply plan and approval prerequisites only after resolving `itsol-workflow-mode`; evidence and root-cause analysis remain mandatory in every mode.

Ten plik jest indeksem routingu dla referencji skilla. Nie ładuj wszystkich plików sektorowych naraz, chyba że zadanie wymaga pełnego audytu. Wybierz tylko pliki pasujące do aktualnej sytuacji.

Ten plik jest wewnętrzną referencją skilla, wyciętą z `developer-task-workflow-feature-bugfix-best-practices.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj wskazanych sektorów referencyjnych bezpośrednio.

## Zakres

Debugowanie i naprawa błędów: triage, opis błędu, reprodukcja, zawężanie, hipotezy i dowody, minimalna poprawka, test regresji, podobne miejsca i antywzorce bugfixów.

## Przeniesione sekcje

- Zasada ogólna
- Dwa tryby pracy
- Praca nad naprawą błędu
- Pytania do gumowej kaczki przy bugfixie
- Antywzorce przy bugfixach
- Debugowanie krok po kroku
- Checklista dla bugfixa
- Proces myślowy - przykład bugfixa
- Edge case'y, które deweloper powinien sam wymyślać
- Kiedy prosić o pomoc
- Komunikacja statusu
- Czerwone flagi podczas pracy
- Definicja ukończenia zadania przez dewelopera

## Jak używać

1. Przeczytaj ten indeks, aby wybrać właściwy sektor.
2. Otwórz tylko te pliki referencyjne, które odpowiadają zadaniu, ryzyku albo etapowi workflow.
3. Jeśli zadanie obejmuje kilka niezależnych obszarów, załaduj kilka sektorów zamiast całego dawnego guide.

## Technical Fix Plan Gate Routing

For bugfix planning, approval guardrails, Fix Decision Gate, Technical Fix Plan template, self-review, and Rubber Duck Plan Review, read `07-technical-fix-plan-gate.md`.

## Pliki referencyjne


- `01-overview.md` (85 linii) - Overview; Zasada ogólna; Dwa tryby pracy
- `02-praca-nad-naprawa-bledu.md` (269 linii) - Praca nad naprawą błędu
- `03-pytania-do-gumowej-kaczki-przy-bugfixie.md` (127 linii) - Pytania do gumowej kaczki przy bugfixie; Antywzorce przy bugfixach
- `04-debugowanie-krok-po-kroku.md` (172 linii) - Debugowanie krok po kroku; Checklista dla bugfixa; Proces myślowy - przykład bugfixa
- `05-edge-case-y-ktore-deweloper-powinien-sam-wymyslac.md` (182 linii) - Edge case'y, które deweloper powinien sam wymyślać; Kiedy prosić o pomoc; Komunikacja statusu; Czerwone flagi podczas pracy
- `06-definicja-ukonczenia-zadania-przez-dewelopera.md` (23 linii) - Definicja ukończenia zadania przez dewelopera
- `07-technical-fix-plan-gate.md` (166 linii) - Technical Fix Plan Gate; Fix Decision Gate; Approval Gate; plan file template; self-review; Rubber Duck Plan Review
