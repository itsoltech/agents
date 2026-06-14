# itsol-self-review Reference Sector: Overview

## Zawartość

- Overview
- Etap 7 - self-review
- Pull request
- Ryzyka
- Problem
- Przyczyna
- Zmiana
- Test regresji
- Reakcja na code review
- Handoff do QA


## Etap 7 - self-review

Self-review to przegląd własnego kodu przed wysłaniem PR. Deweloper powinien czytać diff tak, jakby był reviewerem.

Pytania do self-review:

```text
Czy PR robi tylko jedną rzecz?
Czy nazwy opisują intencję?
Czy usunąłem debug logi, console.log, dbg!, tymczasowe komentarze?
Czy nie zostawiłem martwego kodu?
Czy nie zmieniłem przypadkowo formatowania dużych fragmentów?
Czy testy faktycznie sprawdzają zachowanie, a nie tylko implementację?
Czy obsługa błędów jest spójna z resztą aplikacji?
Czy nowe API ma walidację i autoryzację?
Czy cache po mutacji jest poprawnie odświeżany?
Czy dodałem logi albo metryki tam, gdzie będą potrzebne przy diagnozie?
Czy dokumentacja albo tech notes wymagają aktualizacji?
```

Zachowanie dobre:

```text
Deweloper znajduje własne błędy przed reviewerem i poprawia je przed wysłaniem PR.
```

Zachowanie złe:

```text
Deweloper wysyła PR bez przeczytania własnego diffu.
```
## Pull request

PR powinien być możliwy do sprawdzenia bez zgadywania intencji autora.

Dobry opis PR:

```markdown

## Co zmienia PR

Dodaje historię zmian ceny produktu w panelu produktu.

## Dlaczego

Manager musi widzieć, kto i kiedy zmienił cenę.

## Zakres

- nowy endpoint `GET /products/{id}/price-history`
- zapis historii przy zmianie ceny
- komponent `PriceHistoryPanel`
- invalidacja query po mutacji ceny

## Poza zakresem

- eksport historii do CSV
- historia innych pól produktu

## Jak testowano

- odtworzono problem przed poprawką
- potwierdzono poprawkę lokalnie
- sprawdzono zmianę EACH -> CUBIC i CUBIC -> EACH
```
## Ryzyka

Stare produkty bez historii pokazują empty state.
```

PR dla bugfixa:

```markdown
## Problem

Po zmianie jednostki materiału z EACH na CUBIC widok estimate pokazywał starą cenę do momentu pełnego reloadu.
## Przyczyna

Mutacja `changeMaterialUnit` invalidowała listę estimate items, ale nie invalidowała query szczegółów estimate.
## Zmiana

Dodano invalidację `estimateDetails(id)` po udanej mutacji.
## Test regresji

Dodano test, który wykonuje zmianę jednostki i sprawdza, że szczegóły estimate są pobierane ponownie.
## Reakcja na code review

Code review jest częścią pracy, a nie przeszkodą. Deweloper powinien reagować rzeczowo.

Dobre zachowania:

- odpowiadaj na komentarze konkretnie
- pytaj, jeśli komentarz jest niejasny
- poprawiaj kod albo uzasadniaj decyzję
- nie oznaczaj komentarza jako resolved bez odpowiedzi, jeśli reviewer zadał pytanie
- przy większej zmianie po review dodaj komentarz, co zostało zmienione
- nie traktuj review jako ataku

Przykłady odpowiedzi:

```text
Masz rację, przeniosłem walidację do warstwy backendu i zostawiłem frontend tylko jako feedback dla użytkownika.
```

```text
Zostawiłem `invalidateQueries` zamiast `setQueryData`, bo event z backendu zawiera tylko partial update i nie mamy pełnego modelu listy. Dodałem komentarz w kodzie.
```

```text
Nie wydzielałem tego do osobnego service, bo obecnie użycie jest tylko jedno. Jeśli pojawi się drugi przypadek, będzie dobry moment na ekstrakcję.
```

Złe reakcje:

```text
U mnie działa.
```

```text
Tak było w innym pliku.
```

```text
Nie mam czasu tego poprawiać.
```
## Handoff do QA

Deweloper powinien przekazać QA informację, co zostało zmienione i jak to testować.

Handoff powinien zawierać:

- link do zadania
- link do PR
- środowisko
- zakres zmiany
- co jest poza zakresem
- główne scenariusze testowe
- edge case'y
- dane testowe
- known limitations
- informację o migracji danych, jeśli była
- informację o feature flag, jeśli istnieje

Przykład:

```markdown
QA notes:

Zakres:
- historia zmian ceny produktu
- zapis historii przy zmianie ceny
- widok historii w panelu produktu

Poza zakresem:
- eksport historii
- historia zmian nazwy produktu

Scenariusze:
- produkt bez historii pokazuje empty state
- po zmianie ceny pojawia się nowy wpis
- użytkownik bez permission nie widzi panelu
- błąd API pokazuje error state
- po odświeżeniu strony historia nadal jest widoczna

Dane:
- tenant: demo-restaurant
- user: manager@example.com
- product: Coffee 250g
```
