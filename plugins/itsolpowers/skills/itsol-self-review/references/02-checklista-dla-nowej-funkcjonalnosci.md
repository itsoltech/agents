# itsol-self-review Reference Sector: Checklista dla nowej funkcjonalności

## Zawartość

- Checklista dla nowej funkcjonalności
- Checklista dla bugfixa
- Edge case'y, które deweloper powinien sam wymyślać

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
## Checklista dla bugfixa

### Przed poprawką

```text
[ ] Rozumiem oczekiwane zachowanie.
[ ] Rozumiem faktyczne zachowanie.
[ ] Mam kroki reprodukcji albo inne dowody.
[ ] Wiem, na jakim środowisku występuje problem.
[ ] Wiem, jakich danych dotyczy problem.
[ ] Wiem, czy problem dotyczy jednego użytkownika czy wielu.
[ ] Sprawdziłem, czy problem dotyczy bezpieczeństwa albo danych.
[ ] Mam hipotezę i sposób jej sprawdzenia.
```

### W trakcie debugowania

```text
[ ] Odtworzyłem problem.
[ ] Podzieliłem przepływ na etapy.
[ ] Sprawdziłem request i response.
[ ] Sprawdziłem dane w bazie albo źródle prawdy.
[ ] Sprawdziłem cache/live eventy, jeśli występują.
[ ] Sprawdziłem ostatnie deploye albo zmiany.
[ ] Odrzuciłem błędne hipotezy.
[ ] Znalazłem przyczynę, nie tylko objaw.
```

### Przed PR

```text
[ ] Fix jest możliwie mały.
[ ] Dodałem test regresji.
[ ] Test padałby przed poprawką.
[ ] Sprawdziłem podobne miejsca.
[ ] Sprawdziłem, czy potrzebny jest data fix.
[ ] Opisałem przyczynę w PR.
[ ] Opisałem sposób reprodukcji.
[ ] Opisałem sposób testowania.
[ ] Sprawdziłem, czy bug nie wraca po reloadzie/reconnect/cache refresh.
```
## Edge case'y, które deweloper powinien sam wymyślać

### Użytkownik i uprawnienia

```text
użytkownik bez roli
użytkownik z rolą tylko do odczytu
użytkownik z rolą w innym tenant
użytkownik usunięty/zablokowany
token wygasł podczas pracy
permission zmienił się w trakcie sesji
```

### Dane

```text
brak danych
dużo danych
duplikaty
null/undefined
stare rekordy bez nowego pola
rekord usunięty w tle
rekord zmieniony przez innego użytkownika
niepoprawny typ danych z legacy API
```

### Czas i kolejność

```text
podwójne kliknięcie
dwa requesty równolegle
wolna sieć
timeout
retry
odświeżenie strony w połowie operacji
powrót do poprzedniego widoku
reconnect websocket
eventy w złej kolejności
```

### API i integracje

```text
400 validation error
401 unauthorized
403 forbidden
404 not found
409 conflict
422 domain validation
429 rate limit
500 server error
timeout
partial response
zmiana kontraktu API
zewnętrzna integracja niedostępna
```

### Frontend

```text
loading
error
empty
stale cache
optimistic update
rollback optimistic update
formularz z błędami pól
formularz wysłany Enterem
formularz wysłany dwa razy
nawigacja podczas zapisu
brak internetu
```

### Backend

```text
brak idempotencji
race condition
brak transakcji
deadlock
niepoprawny isolation level
brak indeksu
N+1 query
cache poza transakcją
event wysłany przed commitem
worker przetwarza stare dane
```
