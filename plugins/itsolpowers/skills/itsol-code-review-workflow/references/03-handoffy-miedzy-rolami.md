# itsol-code-review-workflow Reference Sector: Handoffy między rolami

## Zawartość

- Handoffy między rolami
- Checklist dla reviewera

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
## Checklist dla reviewera

- czy rozumiem cel PR?
- czy PR pasuje do story?
- czy kod jest bezpieczny?
- czy dane są spójne?
- czy testy pokrywają ryzyka?
- czy zmiana jest możliwa do utrzymania?
- czy komentarze są konkretne i oznaczone jako blocker/suggestion/nit?
- czy PR można zaakceptować jako poprawę systemu, nawet jeśli nie jest perfekcyjny?
