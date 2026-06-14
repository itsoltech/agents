# itsol-feature-implementation Reference Sector: Pytania do gumowej kaczki przy nowej funkcjonalności

## Zawartość

- Pytania do gumowej kaczki przy nowej funkcjonalności
- Antywzorce przy nowych funkcjonalnościach
- Checklista dla nowej funkcjonalności

## Pytania do gumowej kaczki przy nowej funkcjonalności

Deweloper może dosłownie opowiedzieć zadanie na głos:

```text
Buduję funkcję, która pozwala użytkownikowi...
Dane wejściowe pochodzą z...
Dane zapisuję w...
Po zapisie muszę odświeżyć...
Użytkownik bez uprawnień powinien...
Gdy API zwróci błąd, UI powinien...
Stare dane mogą wyglądać tak...
Najbardziej ryzykowny fragment to...
```

Lista pytań:

```text
Co dokładnie zmieniam?
Dlaczego to jest potrzebne?
Kto użyje tej funkcji?
Jakie są acceptance criteria?
Co jest poza zakresem?
Czy istnieje podobna funkcja?
Czy mogę skopiować istniejący wzorzec?
Czy to wymaga migracji danych?
Czy to wymaga nowego permission?
Czy cache po zmianie będzie spójny?
Czy live eventy muszą coś zrobić?
Czy użytkownik może wykonać tę operację dwa razy?
Czy dwóch użytkowników może wykonać tę operację równocześnie?
Czy działanie jest idempotentne?
Czy UI ma loading, error i empty state?
Czy testuję przypadek z brakiem danych?
Czy testuję przypadek z brakiem uprawnień?
Czy kod będzie zrozumiały dla kogoś za 6 miesięcy?
```
## Antywzorce przy nowych funkcjonalnościach

### Kodowanie od UI bez kontraktu

Objaw:

```text
Deweloper buduje ekran, ale nie wie, jakie dane ma zwrócić backend.
```

Skutek:

```text
Frontend tworzy tymczasowy model, backend tworzy inny model, a integracja wymaga przepisywania.
```

Lepsze zachowanie:

```text
Ustalić minimalny kontrakt API albo mock zgodny z docelowym modelem.
```

### Rozbudowany framework dla małej funkcji

Objaw:

```text
Deweloper dodaje generyczny system pluginów, chociaż potrzebny jest jeden wariant.
```

Skutek:

```text
Kod jest trudniejszy w utrzymaniu, a funkcja powstaje wolniej.
```

Lepsze zachowanie:

```text
Zbudować prosty wariant z jasnym miejscem rozszerzenia.
```

### Mieszanie refaktoru z funkcją

Objaw:

```text
PR zmienia 40 plików, a funkcja dotyczy jednego przepływu.
```

Skutek:

```text
Reviewer nie wie, co jest logiką biznesową, a co zmianą techniczną.
```

Lepsze zachowanie:

```text
Wydzielić refaktor do osobnego PR albo ograniczyć go do fragmentu wymaganego przez zadanie.
```

### Brak obsługi stanów błędów

Objaw:

```text
Funkcja działa tylko na idealnych danych.
```

Skutek:

```text
QA albo klient znajduje błędy przy pierwszym pustym wyniku, 403 albo timeout.
```

Lepsze zachowanie:

```text
Zaplanować loading, error, empty, permission denied i validation errors od początku.
```
## Checklista dla nowej funkcjonalności

### Przed kodowaniem

```text
[ ] Rozumiem cel funkcji.
[ ] Rozumiem użytkownika i rolę.
[ ] Znam acceptance criteria.
[ ] Wiem, co jest poza zakresem.
[ ] Sprawdziłem podobne funkcje.
[ ] Znam wymagane dane wejściowe i wyjściowe.
[ ] Wiem, czy potrzebna jest migracja.
[ ] Wiem, czy potrzebne są nowe uprawnienia.
[ ] Wiem, czy zmiana dotyka cache/live eventów.
[ ] Wiem, jak będę testować.
```

### W trakcie implementacji

```text
[ ] Implementuję mały pionowy wycinek.
[ ] Nie mieszam dużego refaktoru z funkcją.
[ ] Obsługuję loading/error/empty state.
[ ] Walidacja jest po stronie backendu.
[ ] Frontend daje użytkownikowi szybki feedback.
[ ] API ma spójny format błędów.
[ ] Cache jest aktualizowany albo invalidowany.
[ ] Live eventy są obsłużone, jeśli przepływ ich wymaga.
[ ] Stare dane nie psują widoku.
[ ] Uprawnienia są sprawdzane po stronie backendu.
```

### Przed PR

```text
[ ] Przeczytałem własny diff.
[ ] Usunąłem debug logi.
[ ] Dodałem testy.
[ ] Sprawdziłem happy path.
[ ] Sprawdziłem błąd API.
[ ] Sprawdziłem brak danych.
[ ] Sprawdziłem brak uprawnień.
[ ] Sprawdziłem odświeżenie strony.
[ ] Sprawdziłem cache po mutacji.
[ ] Opisałem sposób testowania w PR.
```
