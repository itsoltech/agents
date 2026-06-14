# itsol-bug-debugging Reference Sector: Edge case'y, które deweloper powinien sam wymyślać

## Zawartość

- Edge case'y, które deweloper powinien sam wymyślać
- Kiedy prosić o pomoc
- Komunikacja statusu
- Czerwone flagi podczas pracy

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
## Kiedy prosić o pomoc

Proszenie o pomoc nie jest porażką. Problemem jest długie blokowanie pracy bez komunikacji.

Poproś o pomoc, gdy:

- nie rozumiesz celu zadania
- brakuje danych do reprodukcji
- nie możesz odtworzyć błędu
- utknąłeś na tej samej hipotezie
- zmiana dotyka obszaru, którego nie znasz
- istnieje ryzyko uszkodzenia danych
- zmiana dotyka bezpieczeństwa
- fix wymaga decyzji produktowej
- rozwiązanie zaczyna być dużo większe niż zadanie

Dobry komunikat do zespołu:

```text
Utknąłem na bugfixie dotyczącym przeliczania ceny.
Sprawdziłem:
- request z UI zawiera poprawną jednostkę
- API zapisuje jednostkę poprawnie
- po reloadzie dane z API są poprawne
- zły stan pojawia się po live event `estimate.updated`

Moja hipoteza:
event nadpisuje cache starszą wersją estimate.

Potrzebuję pomocy w sprawdzeniu mechanizmu revision/event ordering.
```

Słaby komunikat:

```text
Nie działa, ktoś pomoże?
```
## Komunikacja statusu

Deweloper powinien komunikować stan pracy, gdy zadanie jest niejasne, ryzykowne albo się przedłuża.

Dobry status:

```text
Status:
- implementacja endpointu gotowa
- frontend pokazuje dane i empty state
- zostało: obsługa permission denied i test regresji
- ryzyko: obecne API nie zwraca `changedBy`, potrzebna decyzja czy dodać pole teraz
```

Status przy bugfixie:

```text
Status:
- problem odtworzony lokalnie
- przyczyna: brak invalidacji `estimateDetails(id)` po zmianie jednostki
- fix gotowy
- dodaję test regresji
- sprawdzam analogiczne mutacje
```

Status, gdy deweloper jest zablokowany:

```text
Bloker:
Nie da się potwierdzić oczekiwanego zachowania dla starych rekordów bez `unitAliasId`.
Potrzebna decyzja:
- pokazać rekord jako unknown
- ukryć rekord
- wykonać migrację danych
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
