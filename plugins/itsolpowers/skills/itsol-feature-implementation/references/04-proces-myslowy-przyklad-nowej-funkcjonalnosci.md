# itsol-feature-implementation Reference Sector: Proces myślowy - przykład nowej funkcjonalności

## Zawartość

- Proces myślowy - przykład nowej funkcjonalności
- Edge case'y, które deweloper powinien sam wymyślać

## Proces myślowy - przykład nowej funkcjonalności

Zadanie:

```text
Dodać możliwość oznaczania zamówienia jako „ready for pickup”.
```

Myślenie dewelopera:

```text
1. Kto używa tej funkcji?
Pracownik kuchni.

2. Co się zmienia?
Status zamówienia przechodzi z `in_progress` na `ready_for_pickup`.

3. Czy każdy może to zrobić?
Nie. Potrzebne permission dla kitchen staff albo managera.

4. Czy status można zmienić z każdego stanu?
Nie. Tylko z `in_progress`.

5. Co jeśli użytkownik kliknie dwa razy?
Operacja powinna być idempotentna albo drugi request powinien dostać bezpieczny wynik.

6. Co z frontend cache?
Trzeba zaktualizować listę zamówień i szczegóły zamówienia.

7. Czy są live eventy?
Tak. Inne ekrany powinny dostać `order.status_changed`.

8. Czy trzeba audit log?
Tak, jeśli statusy zamówień są audytowane.

9. Jak testować?
Test backendowy dla przejścia statusu, test braku permission, test niepoprawnego przejścia statusu, test frontendu dla zmiany stanu przycisku.
```

Minimalny plan:

```markdown
- dodać endpoint `POST /orders/{id}/mark-ready`
- dodać walidację przejścia statusu
- dodać permission check
- dodać event `order.status_changed`
- zaktualizować UI akcji zamówienia
- invalidować `ordersList` i `orderDetails(id)`
- dodać testy backendowe i frontendowe
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
