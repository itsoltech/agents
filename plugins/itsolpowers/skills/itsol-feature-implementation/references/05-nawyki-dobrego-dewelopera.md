# itsol-feature-implementation Reference Sector: Nawyki dobrego dewelopera

## Zawartość

- Nawyki dobrego dewelopera
- Definicja gotowości zadania do implementacji
- Definicja ukończenia zadania przez dewelopera

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
## Definicja gotowości zadania do implementacji

Zadanie jest gotowe do pracy, jeśli deweloper zna:

```text
[ ] cel biznesowy albo techniczny
[ ] oczekiwane zachowanie
[ ] zakres
[ ] rzeczy poza zakresem
[ ] acceptance criteria
[ ] dane testowe albo sposób ich utworzenia
[ ] wymagane uprawnienia
[ ] zależności od innych zadań
[ ] wpływ na API/cache/eventy/dane
[ ] sposób testowania
```

Jeśli część informacji nie jest znana, zadanie nadal może być realizowane, ale brak musi być świadomie zapisany.
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
