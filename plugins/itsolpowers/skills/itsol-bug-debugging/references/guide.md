# itsol-bug-debugging Reference Index

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

## Technical Fix Plan Gate

Przed zmianą kodu produkcyjnego agent musi najpierw przeanalizować błąd i zapisać jeden Technical Fix Plan. Nie twórz osobnego Business Planu dla bugfixa; problem biznesowy wynika z niepoprawnego zachowania aplikacji.

Technical Fix Plan zawsze zaczyna jako `Draft`. Agent nie może sam oznaczyć planu jako `Approved`, nawet jeśli użytkownik w pierwotnej wiadomości poprosił o naprawę, implementację, kontynuację albo "zrób to".

### Kolejność

1. Zbierz dowody: reprodukcja, logi, trace'y, failing test, dane, konfiguracja, kontrakty API, podobne ścieżki.
2. Jeśli `.itsol.md` istnieje, użyj `itsol-repo-memory` i dopasuj politykę projektu dla dotkniętych ścieżek.
3. Oddziel fakty od hipotez. Nie przedstawiaj planu jako pewnego, jeśli root cause nie jest jeszcze potwierdzony.
4. Jeśli brakuje danych, zadaj użytkownikowi konkretne pytania albo zaproponuj diagnostykę przed planem.
5. Zawsze uruchom Fix Decision Gate: pokaż warianty naprawy albo jeden wymuszony wariant z uzasadnieniem, tradeoffy, rekomendację i zapytaj użytkownika, którą ścieżkę wybrać albo czy akceptuje rekomendację.
6. Zapisz Technical Fix Plan w repo ze statusem `Draft`.
7. Wykonaj self-review planu i popraw luki.
8. Uruchom Rubber Duck Plan Review przez subagenta `itsol-self-review` i rozwiąż materialne znaleziska.
9. Pokaż użytkownikowi ścieżkę planu oraz krótkie podsumowanie i poproś o akceptację albo uwagi.
10. Dopiero po jawnej akceptacji użytkownika zmień status planu na `Approved` i implementuj poprawkę przez TDD albo repo-policy replacement verification.

### Fix Decision Gate

Agent musi zapytać użytkownika, jaką ścieżką chce naprawić problem, zanim napisze Technical Fix Plan. Jeśli istnieje tylko jeden rozsądny wariant, agent nadal pokazuje ten wariant, wyjaśnia dlaczego jest najlepszy lub wymuszony, i prosi użytkownika o potwierdzenie.

Fix Decision Gate powinien zawierać:

1. Krótkie podsumowanie dowodów i hipotezy/root cause.
2. Dwa do czterech wariantów naprawy z tradeoffami albo jeden wymuszony wariant z uzasadnieniem.
3. Rekomendację agenta z uzasadnieniem.
4. Pytanie do użytkownika o wybór wariantu albo akceptację rekomendacji.

Przykładowe warianty:

- najmniejszy hotfix root cause
- kompatybilna poprawka z obsługą starych danych
- szerszy refactor danego modułu
- feature flag / rollout etapowy
- naprawa backend-only, frontend-only albo full-stack
- szybka diagnostyka/spike przed planem, jeśli root cause nie jest potwierdzony

Nie ukrywaj takiej decyzji w Technical Fix Planie jako "implementation detail".

### Approval Gate

Akceptacja planu musi być jawna, osobna i świadoma.

Prawidłowa akceptacja wymaga:

1. Plan został zapisany ze statusem `Draft`.
2. Agent pokazał użytkownikowi ścieżkę planu i krótkie podsumowanie.
3. Agent zadał bezpośrednie pytanie o akceptację planu.
4. Użytkownik odpowiedział po tym pytaniu jednoznacznie, np. `approve`, `approved`, `akceptuję`, `zatwierdzam`, `ok, wdrażaj` albo równoważnie.

Nieprawidłowe źródła akceptacji:

- `Approved by direct user request`
- pierwotna prośba użytkownika o naprawę
- `kontynuuj`, jeśli użytkownik nie widział jeszcze planu
- cisza, brak sprzeciwu albo wcześniejsza zgoda na inny plan
- zgoda wywnioskowana przez agenta

Jeśli odpowiedź jest niejednoznaczna, plan pozostaje `Draft`, a agent ma zapytać o akceptację albo uwagi. Nie wolno zaczynać implementacji, gdy Technical Fix Plan ma status `Draft`.

### Plik Planu

Domyślna lokalizacja:

- `.itsol/plans/YYYY-MM-DD-<bug-slug>-fix.md`

Użyj innej lokalizacji tylko wtedy, gdy repo ma jasną konwencję planów albo użytkownik wskaże inne miejsce. Nie zapisuj planów w katalogach dokumentacji źródłowej pluginu ani w zewnętrznych best-practices.

### Szablon Technical Fix Planu

```markdown
# <Bug or Symptom> Technical Fix Plan

**Status:** Draft
**Created:** YYYY-MM-DD
**Related issue/request:** <short summary or ticket link>

## Symptom
<Expected behavior, actual behavior, impact, affected users, severity, and environment.>

## Evidence
- <Reproduction command, failing test, logs, traces, screenshots, data sample, API response, deployment evidence>

## Suspected Or Confirmed Root Cause
<State whether confirmed or suspected. Link to exact files, functions, queries, configs, or runtime behavior.>

## Scope
### In Scope
- <Fix scope>

### Out Of Scope
- <Explicit exclusions and follow-up bugs>

## Required ITSOL Skills
| Skill | Use During | Reason |
| --- | --- | --- |
| `itsol-bug-debugging` | whole fix | evidence-first bug workflow |
| `itsol-repo-memory` | planning and implementation | apply `.itsol.md` TDD mode and verification policy |
| `itsol-tdd-workflow` | before production code changes | RED regression gate |
| `<domain-debugging-or-review-skill>` | specific area | frontend, backend, database, infra, security, generated client, or review coverage |

## Files And Ownership
| Path | Action | Purpose |
| --- | --- | --- |
| `path/to/file` | Create/Modify/Test | reason |

## Fix Strategy
- <Smallest root-cause change>
- <Important `if`/else behavior, validation, tenant/auth checks, error handling, retry/idempotency/concurrency behavior>

## TDD Regression Plan
**TDD Mode:** `<full | limited | not-supported | not-applicable | unknown>`
**Policy Source:** `<.itsol.md project section | repo default | none>`

### RED
- Test or diagnostic to add first
- Expected failing output

If TDD mode is `limited`, `not-supported`, or `not-applicable`, do not scaffold a new test framework only to satisfy TDD. Document why RED/GREEN is skipped and list replacement verification.

### GREEN
- Minimal fix expected to pass

### REFACTOR
- Cleanup allowed only after tests pass

## Verification Plan
- `<command>` and expected result
- manual smoke scenario
- related-path regression check

## Risk And Rollback
- <Regression risk, data risk, deployment risk, rollback or mitigation>

## Open Questions
- <Question or "None">
```

### Plan Self-Review

Przed prośbą o akceptację sprawdź i popraw:

- brak `TODO`, `TBD`, placeholderów i pustych sekcji
- czy symptom, expected/actual behavior i impact są konkretne
- czy evidence potwierdza root cause albo jasno oznacza hipotezę
- czy plan nie miesza kilku niezależnych bugów
- czy wymagane ITSOL skills są kompletne dla obszaru zmiany
- czy TDD regression plan ma konkretny RED test albo diagnostykę
- czy fix strategy jest najmniejszą zmianą usuwającą root cause
- czy verification plan pokrywa failing path i related paths
- czy ryzyka i rollback są opisane albo sensownie oznaczone jako nie dotyczy

Jeśli self-review ujawni brakujące dowody lub nierozstrzygnięte pytania, zatrzymaj się i zapytaj użytkownika albo zaproponuj diagnostykę. Nie proś o zatwierdzenie planu z ukrytymi lukami.

### Rubber Duck Plan Review

Po self-review, a przed prośbą o akceptację, użyj subagenta `itsol-self-review` jako krytycznego recenzenta planu. W Codex uruchom subagenta z forked context bez jawnego `agent_type` i przekaż `itsol-self-review` jako wymagany skill/instrukcję; nie łącz `fork_context` z rolą `explorer` ani `worker`. Powiedz reviewerowi, że jest już delegowanym subagentem i nie może uruchamiać kolejnego subagenta, `codex exec`, `claude` ani innego agentowego CLI. Subagent ma działać read-only i zwrócić:

- blockery
- ważne luki
- pytania do użytkownika przed approval
- sekcje planu do poprawy
- werdykt `ready for approval` albo `not ready for approval`

Nie proś użytkownika o akceptację, dopóki materialne znaleziska z Rubber Duck Review nie są rozwiązane.

## Pliki referencyjne

- `01-overview.md` (85 linii) - Overview; Zasada ogólna; Dwa tryby pracy
- `02-praca-nad-naprawa-bledu.md` (269 linii) - Praca nad naprawą błędu
- `03-pytania-do-gumowej-kaczki-przy-bugfixie.md` (127 linii) - Pytania do gumowej kaczki przy bugfixie; Antywzorce przy bugfixach
- `04-debugowanie-krok-po-kroku.md` (172 linii) - Debugowanie krok po kroku; Checklista dla bugfixa; Proces myślowy - przykład bugfixa
- `05-edge-case-y-ktore-deweloper-powinien-sam-wymyslac.md` (182 linii) - Edge case'y, które deweloper powinien sam wymyślać; Kiedy prosić o pomoc; Komunikacja statusu; Czerwone flagi podczas pracy
- `06-definicja-ukonczenia-zadania-przez-dewelopera.md` (23 linii) - Definicja ukończenia zadania przez dewelopera
