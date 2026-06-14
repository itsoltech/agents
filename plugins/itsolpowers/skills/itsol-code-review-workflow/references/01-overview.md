# itsol-code-review-workflow Reference Sector: Overview

## Zawartość

- Overview
- Implementacja z perspektywy developera


## Implementacja z perspektywy developera

Developer nie powinien zaczynać od pisania kodu. Najpierw powinien sprawdzić, czy rozumie cel, zakres i sposób weryfikacji.

### Przed rozpoczęciem kodowania

Sprawdź:

- czy story spełnia Definition of Ready
- czy acceptance criteria są jasne
- czy są tech notes, jeśli zmiana ich wymaga
- czy znasz aktualne działanie systemu
- czy potrafisz odtworzyć problem lokalnie lub na środowisku testowym
- czy masz dane testowe
- czy znasz uprawnienia i role użytkowników
- czy zmiana wymaga migracji danych
- czy zmiana wymaga aktualizacji API klienta
- czy zmiana wymaga feature flag
- czy QA będzie wiedziało, jak testować

Jeśli czegoś brakuje, zapytaj przed implementacją. Nie zgaduj zasad biznesowych.

### Podczas implementacji

- implementuj najmniejszy sensowny vertical slice
- utrzymuj małe, czytelne commity, jeśli projekt tego wymaga
- nie mieszaj refaktoru z funkcją bez wyraźnego powodu
- jeśli refaktor jest konieczny, opisz to w PR
- nie zmieniaj zakresu story bez uzgodnienia
- obsługuj błędy jawnie
- nie ukrywaj błędów przez puste catch, default albo fallback bez logu
- dodaj walidację po stronie backendu, nawet jeśli frontend też waliduje dane
- nie ufaj danym z klienta, przeglądarki, localStorage, query stringa albo WebSocket
- sprawdź autoryzację na backendzie
- dodaj testy tam, gdzie ryzyko regresji jest realne
- dodaj logi i metryki tam, gdzie pomogą w utrzymaniu
- nie loguj sekretów ani danych wrażliwych
- aktualizuj dokumentację, jeśli zmienia się kontrakt API albo zachowanie systemu

### Self-review developera

Przed wystawieniem PR developer powinien sam przejrzeć zmianę tak, jak reviewer.

Checklist:

- czy kod spełnia każde acceptance criterion?
- czy są testy dla happy path?
- czy są testy dla błędów i braku uprawnień?
- czy nie zostały console logi, debug output, tymczasowe flagi albo dead code?
- czy linter, formatowanie i type-check przechodzą?
- czy migracje działają na pustej i istniejącej bazie?
- czy rollback jest możliwy albo świadomie opisany jako niemożliwy?
- czy API zwraca poprawne statusy i błędy?
- czy UI ma loading, error i empty state?
- czy dane po odświeżeniu strony nadal są poprawne?
- czy cache jest invalidowany albo aktualizowany?
- czy eventy live nie dublują danych?
- czy użytkownik bez uprawnień nie może wykonać operacji bezpośrednio przez API?
- czy zmiana działa dla kilku tenantów lub organizacji?
- czy wydajność jest akceptowalna dla dużych danych?

### Opis pull requesta

Pull request powinien odpowiadać na pytania reviewera i QA.

Szablon:

```markdown
# Opis

Co zmienia PR i dlaczego.

## Linki

- Story:
- Tech notes:
- Makiety:

## Zakres

- element 1
- element 2

## Poza zakresem

- element 1

## Jak testowałem

- test 1
- test 2
- test 3

## Ryzyka

- ryzyko 1
- ryzyko 2

## Migracje / config / deployment

- migracja:
- nowe zmienne env:
- feature flag:

## Screenshoty / nagranie

- link albo załącznik

## Notatki dla QA

Jakie scenariusze sprawdzić i na co uważać.
```
