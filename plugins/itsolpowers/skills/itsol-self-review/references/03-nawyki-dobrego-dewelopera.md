# itsol-self-review Reference Sector: Nawyki dobrego dewelopera

## Zawartość

- Nawyki dobrego dewelopera
- Czerwone flagi podczas pracy
- Definicja ukończenia zadania przez dewelopera
- Standard pracy dla junior/mid dewelopera

## Nawyki dobrego dewelopera

### Zanim zapytasz, przygotuj kontekst

Słabe pytanie:

```text
Czemu to nie działa?
```

Dobre pytanie:

```text
Próbuję naprawić błąd X.
Odtworzyłem go przez kroki A, B, C.
Sprawdziłem request i jest poprawny.
Backend zwraca poprawne dane.
Problem pojawia się po invalidacji cache.
Podejrzewam query key mismatch.
Czy możesz spojrzeć na mapowanie query keys w tym module?
```

### Zanim napiszesz kod, sprawdź istniejący wzorzec

Pytania:

```text
Czy podobna funkcja już istnieje?
Czy projekt ma standard obsługi błędów?
Czy projekt ma standard walidacji?
Czy projekt ma standard query keys?
Czy projekt ma standard permissions?
Czy projekt ma standard eventów?
```

### Zanim zrobisz refaktor, nazwij problem

Pytania:

```text
Jaki problem rozwiązuje refaktor?
Czy problem blokuje obecne zadanie?
Czy refaktor zmniejsza ryzyko, czy je zwiększa?
Czy mogę go zrobić osobnym PR?
Czy po refaktorze zachowanie jest pokryte testami?
```

### Zanim oddasz zadanie, przejdź flow jak użytkownik

Pytania:

```text
Czy użytkownik rozumie, co się stało?
Czy użytkownik widzi wynik operacji?
Czy użytkownik dostaje sensowny błąd?
Czy można bezpiecznie spróbować ponownie?
Czy dane po odświeżeniu strony są poprawne?
```
## Czerwone flagi podczas pracy

Deweloper powinien zatrzymać się i doprecyzować zadanie, gdy:

- kod zaczyna dotykać dużo większego zakresu niż opis zadania
- wymagane jest obejście braku decyzji produktowej
- poprawka wymaga ręcznej zmiany danych produkcyjnych
- logika bezpieczeństwa jest niejasna
- zmiana wpływa na płatności, raporty, rozliczenia albo uprawnienia
- nie da się napisać testu, bo odpowiedzialności są wymieszane
- deweloper nie umie powiedzieć, jak sprawdzić poprawność
- nowa funkcja wymaga zmiany kontraktu API używanego przez inne aplikacje
- bugfix wymaga zgadywania bez danych
- PR robi kilka niepowiązanych rzeczy
## Definicja ukończenia zadania przez dewelopera

Zadanie jest gotowe do code review, jeśli:

```text
[ ] kod kompiluje się i przechodzi lint
[ ] testy lokalne przechodzą
[ ] deweloper przeczytał własny diff
[ ] dodano albo zaktualizowano testy
[ ] usunięto debug logi i tymczasowy kod
[ ] obsłużono błędy i edge case'y
[ ] sprawdzono uprawnienia
[ ] sprawdzono cache/live eventy, jeśli dotyczy
[ ] opis PR wyjaśnia zmianę
[ ] opis PR zawiera sposób testowania
[ ] QA dostaje jasne notes, jeśli zadanie wymaga testów manualnych
```
## Standard pracy dla junior/mid dewelopera

Dobry junior/mid nie musi znać odpowiedzi na wszystko. Powinien jednak pracować w uporządkowany sposób.

Oczekiwane zachowania:

- czyta zadanie przed kodowaniem
- pyta o brakujące wymagania
- szuka podobnych rozwiązań w kodzie
- robi małe zmiany
- testuje własny kod
- opisuje, co sprawdził
- umie powiedzieć, gdzie utknął
- nie ukrywa problemów do końca dnia
- nie wysyła PR bez self-review
- poprawia komentarze z review
- uczy się z bugów i dopisuje testy regresji

Nieoczekiwane zachowania:

- implementowanie z samego tytułu
- zgadywanie reguł biznesowych
- ignorowanie acceptance criteria
- zostawianie testowania QA
- brak komunikacji przy blokerze
- masowe refaktory bez potrzeby
- poprawki „żeby działało u mnie”
- brak testu po bugfixie
