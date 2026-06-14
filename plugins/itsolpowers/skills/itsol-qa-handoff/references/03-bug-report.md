# itsol-qa-handoff Reference Sector: Bug report

## Zawartość

- Bug report
- Jak wymyślać edge case'y

## Bug report

Dobry bug report powinien pozwolić developerowi odtworzyć problem bez dodatkowego dopytywania.

Szablon:

```markdown
# Bug - [krótki tytuł]

## Środowisko

- URL:
- Build / commit:
- Przeglądarka / urządzenie:
- Konto / rola:
- Tenant / organizacja:

## Kroki reprodukcji

1. Krok 1
2. Krok 2
3. Krok 3

## Aktualny rezultat

Co się dzieje.

## Oczekiwany rezultat

Co powinno się stać.

## Dane testowe

ID obiektu, payload, plik, screen.

## Częstotliwość

- zawsze / czasami / raz

## Załączniki

Screenshot, nagranie, log, request/response.

## Wpływ

Kto jest dotknięty i czy istnieje workaround.

## Severity / priority

Propozycja z uzasadnieniem.
```

### Severity i priority

Severity opisuje wpływ techniczny lub biznesowy błędu. Priority opisuje kolejność naprawy.

Przykładowa klasyfikacja:

- `S1` - produkcja niedostępna, utrata danych, krytyczna luka bezpieczeństwa, brak możliwości wykonania głównego procesu
- `S2` - główny proces działa błędnie, ale istnieje workaround; błąd dotyczy wielu użytkowników
- `S3` - błąd w pobocznym procesie, ograniczony wpływ, workaround istnieje
- `S4` - kosmetyka, literówka, mała niespójność UI

Priority może być inne niż severity. Literówka w widocznym miejscu kampanii może mieć wysokie priority mimo niskiego severity. Krytyczny błąd w funkcji niewydanej użytkownikom może mieć niższe priority, jeśli jest za feature flagiem.
## Jak wymyślać edge case'y

Edge case'y nie powinny być losową listą. Najlepiej przechodzić po wymiarach systemu i sprawdzać, co może się zmienić.

### Wymiary edge case'ów

#### Aktor

- użytkownik zalogowany
- użytkownik niezalogowany
- użytkownik bez uprawnień
- użytkownik z częściowymi uprawnieniami
- admin
- użytkownik z innego tenant'a
- konto zablokowane
- konto usunięte

#### Dane

- puste wartości
- wartości minimalne
- wartości maksymalne
- null
- undefined, jeśli dotyczy JS/TS
- zły typ danych
- duplikaty
- znaki Unicode
- HTML/script w polach tekstowych
- bardzo długie stringi
- bardzo duże pliki
- dane historyczne niezgodne z nową walidacją

#### Stan systemu

- obiekt istnieje
- obiekt nie istnieje
- obiekt został usunięty
- obiekt został zmieniony przez inną osobę
- obiekt ma inny status niż oczekiwany
- feature flag jest włączony
- feature flag jest wyłączony
- zależny system nie odpowiada
- kolejka ma opóźnienie

#### Czas

- koniec dnia
- koniec miesiąca
- zmiana strefy czasowej
- zmiana czasu letniego/zimowego
- data w przeszłości
- data w przyszłości
- deadline minął podczas edycji
- token wygasł podczas operacji

#### Współbieżność

- dwie osoby edytują ten sam obiekt
- użytkownik klika submit kilka razy
- request jest ponowiony po timeout
- WebSocket przysyła event podczas edycji
- cache ma stare dane
- job przetwarza dane równolegle z requestem użytkownika

#### Sieć i infrastruktura

- wolne połączenie
- brak internetu
- timeout API
- błąd 500
- błąd 429
- restart backendu
- reconnect WebSocket
- failover bazy
- request zakończony sukcesem, ale frontend nie dostał odpowiedzi

#### Bezpieczeństwo

- manipulacja ID w URL
- manipulacja payloadem przez DevTools
- brak CSRF tokenu, jeśli dotyczy cookie-based auth
- próba XSS
- upload nieprawidłowego pliku
- replay requestu
- dostęp do danych innego tenant'a
- wymuszenie roli po stronie klienta

### Macierz edge case'ów

Dla większych funkcji warto stworzyć prostą macierz:

```markdown
| Wymiar | Przypadek | Oczekiwane zachowanie | Test |
| --- | --- | --- | --- |
| Rola | User bez permission | 403 / brak akcji | manual/API |
| Dane | quantity = 0 | błąd walidacji | unit/API |
| Stan | dokument Approved | edycja zablokowana | E2E |
| Czas | token wygasł | redirect do logowania | manual |
| Sieć | retry po timeout | brak duplikatu | integration |
```
