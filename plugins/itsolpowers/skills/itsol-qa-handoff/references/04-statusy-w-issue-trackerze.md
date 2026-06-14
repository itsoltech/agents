# itsol-qa-handoff Reference Sector: Statusy w issue trackerze

## Zawartość

- Statusy w issue trackerze
- Handoffy między rolami
- Release i wdrożenie
- Metryki procesu
- Antypatterny procesowe

## Statusy w issue trackerze

Przykładowy przepływ statusów:

- `New` - zgłoszone, bez analizy
- `Discovery` - zbieranie informacji
- `Ready for refinement` - opis wstępny gotowy do rozmowy z zespołem
- `Refinement` - doprecyzowanie zakresu
- `Ready for dev` - spełnia Definition of Ready
- `In development` - implementacja
- `Code review` - PR gotowy do review
- `Changes requested` - poprawki po review
- `Ready for QA` - zmiana zmergowana lub dostępna na środowisku testowym
- `QA in progress` - testy
- `QA failed` - błędy blokujące
- `Ready for release` - gotowe do wydania
- `Released` - wdrożone
- `Verified on production` - sprawdzone po wdrożeniu, jeśli wymagane
- `Done` - zakończone

Nie każdy zespół potrzebuje wszystkich statusów. Ważne, żeby status mówił, kto ma wykonać następny krok.
## Handoffy między rolami

### Product -> development

Przekazywane informacje:

- story
- acceptance criteria
- linki do ustaleń
- makiety
- dane testowe
- decyzje klienta
- priorytet
- elementy poza zakresem

### Development -> code review

Przekazywane informacje:

- PR z opisem
- link do story
- link do tech notes
- opis testów
- screenshoty lub nagranie
- ryzyka
- migracje i config

### Development -> QA

Przekazywane informacje:

- link do środowiska
- co zostało zmienione
- jak testować
- dane testowe
- konta testowe
- znane ograniczenia
- obszary regresji
- feature flag albo konfiguracja

### QA -> development

Przekazywane informacje:

- bug report z krokami reprodukcji
- aktualny i oczekiwany rezultat
- dane testowe
- screen/nagranie/logi
- severity i wpływ
- informacja, czy blokuje release
## Release i wdrożenie

Nie każde zadanie wymaga osobnego planu release. Zmiany ryzykowne powinny mieć jednak opisane wdrożenie.

### Pytania przed release

- Czy zmiana jest za feature flagiem?
- Czy migracja jest kompatybilna wstecznie?
- Czy stare wersje aplikacji będą działały po wdrożeniu backendu?
- Czy można wdrożyć backend przed frontendem?
- Czy rollback wymaga cofnięcia migracji?
- Czy QA przetestowało build, który będzie wdrażany?
- Czy support wie, jak rozpoznać problem?
- Jakie logi i metryki obserwujemy po wdrożeniu?
- Kto podejmuje decyzję o rollbacku?

### Plan release dla zmiany ryzykownej

```markdown
# Plan release

## Zakres

Co wdrażamy.

## Kolejność

1. migracja bezpieczna wstecznie
2. backend
3. frontend
4. włączenie feature flag

## Walidacja po wdrożeniu

- check 1
- check 2

## Monitoring

- metryka 1
- log 1
- alert 1

## Rollback

Jak wrócić do poprzedniego stanu.

## Osoby odpowiedzialne

- release owner:
- developer:
- QA:
- product:
```
## Metryki procesu

Metryki powinny pomagać wykrywać problemy w procesie, nie karać osoby.

Przydatne metryki:

- lead time od zgłoszenia do wdrożenia
- cycle time od startu implementacji do wdrożenia
- czas oczekiwania na decyzję klienta
- liczba zadań cofniętych z developmentu do refinementu
- liczba PR cofniętych do większych zmian
- liczba bugów znalezionych przez QA
- liczba bugów, które uciekły na produkcję
- reopen rate dla story
- liczba zmian zakresu po rozpoczęciu implementacji
- czas code review
- WIP per developer i per zespół

Czego nie mierzyć jako celu jakościowego:

- liczby commitów
- liczby linii kodu
- samej liczby story zamkniętych bez kontekstu
- liczby komentarzy w review jako wskaźnika jakości
## Antypatterny procesowe

- zaczynanie developmentu na podstawie jednego zdania od klienta
- acceptance criteria pisane po implementacji
- story będąca listą zadań technicznych bez wartości lub testowalnego rezultatu
- brak właściciela decyzji
- ukryte zmiany zakresu podczas implementacji
- PR zawierający refaktor, funkcję, migrację i zmianę stylu naraz
- code review skupione na formatowaniu zamiast na ryzyku
- QA bez danych testowych
- QA testujące tylko happy path
- brak regresji dla powiązanych modułów
- wdrożenie migracji bez rollbacku albo przynajmniej planu awaryjnego
- brak komunikacji do supportu przy zmianie widocznej dla użytkownika
- zamykanie bugów bez potwierdzenia na środowisku, na którym wystąpił problem
