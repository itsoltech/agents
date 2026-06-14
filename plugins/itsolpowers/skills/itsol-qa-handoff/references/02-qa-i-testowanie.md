# itsol-qa-handoff Reference Sector: QA i testowanie

## Zawartość

- QA i testowanie

## QA i testowanie

QA powinno zaczynać się od wymagań, nie od gotowego builda. Tester powinien czytać story, acceptance criteria, tech notes i PR, a następnie budować scenariusze na podstawie ryzyka.

### Cele QA

- sprawdzić, czy funkcja spełnia acceptance criteria
- znaleźć błędy w happy path i edge case'ach
- sprawdzić regresje w powiązanych obszarach
- sprawdzić uprawnienia i dostęp do danych
- sprawdzić błędy, puste stany i dane graniczne
- sprawdzić, czy system zachowuje się poprawnie po odświeżeniu, retry i utracie połączenia
- dostarczyć jasne bug reporty z krokami reprodukcji

### Wejście dla QA

QA powinno dostać:

- link do story
- acceptance criteria
- tech notes, jeśli istnieją
- link do środowiska testowego
- dane testowe
- role i konta testowe
- opis migracji lub konfiguracji
- notatki developera z PR
- listę obszarów regresji

### Plan testów QA

Szablon:

```markdown
# Plan QA - [tytuł]

## Linki

- Story:
- PR:
- Tech notes:
- Środowisko:

## Zakres testów

Co testujemy.

## Poza zakresem

Czego nie testujemy w tej rundzie.

## Dane testowe

Konta, role, tenanty, przykłady danych.

## Scenariusze happy path

- scenariusz 1
- scenariusz 2

## Scenariusze negatywne

- brak uprawnień
- błędne dane
- brak wymaganych pól
- konflikt stanu

## Edge case'y

- przypadek 1
- przypadek 2

## Regresja

Obszary powiązane, które trzeba sprawdzić.

## Security smoke

Minimalne testy uprawnień i walidacji.

## Wynik

- passed / failed
- lista bugów
- decyzja QA
```

### Techniki projektowania testów

#### Klasy równoważności

Dziel dane wejściowe na grupy, które powinny zachowywać się tak samo.

Przykład dla pola `quantity`:

- poprawne wartości dodatnie
- zero
- liczby ujemne
- wartość pusta
- tekst zamiast liczby
- bardzo duża liczba

#### Wartości brzegowe

Testuj granice, nie tylko typowe wartości.

Przykład limitu 100 znaków:

- 0 znaków
- 1 znak
- 99 znaków
- 100 znaków
- 101 znaków
- znaki Unicode
- spacje na początku i końcu

#### Tablice decyzyjne

Stosuj, gdy wynik zależy od kilku warunków.

Przykład:

- rola użytkownika
- status dokumentu
- właściciel dokumentu
- feature flag
- tenant

#### Przejścia stanów

Stosuj, gdy obiekt ma statusy.

Przykład:

- Draft -> Submitted
- Submitted -> Approved
- Submitted -> Rejected
- Approved -> Cancelled
- próba Draft -> Approved, jeśli nie jest dozwolona

#### Testy eksploracyjne

Stosuj po przejściu głównych scenariuszy. Tester próbuje używać funkcji jak realny użytkownik, szukając sprzeczności, dziur i zachowań nieopisanych w story.

### Obszary testów QA

#### Funkcjonalność

- happy path
- błędy walidacji
- błędy serwera
- brak danych
- duże dane
- odświeżenie strony
- powrót do poprzedniego kroku
- anulowanie operacji
- powtarzanie operacji

#### Uprawnienia

- użytkownik z dostępem
- użytkownik bez dostępu
- użytkownik z częściowym dostępem
- admin
- użytkownik z innego tenant'a
- bezpośrednie wywołanie API mimo ukrytego przycisku

#### Dane

- dane kompletne
- dane częściowe
- dane historyczne
- dane w złym formacie
- duplikaty
- usunięte lub zarchiwizowane zależności
- znaki specjalne
- duże liczby
- różne strefy czasowe

#### API

- poprawny request
- brak wymaganych pól
- złe typy pól
- brak autoryzacji
- brak uprawnień
- konflikt stanu
- retry tego samego requestu
- timeout
- odpowiedź z systemu zewnętrznego z błędem

#### Frontend

- loading state
- empty state
- error state
- success state
- disabled state
- walidacja formularza
- odświeżenie strony
- nawigacja wstecz
- kilka kart przeglądarki
- cache po mutacji
- eventy live
- responsive layout
- dostępność klawiaturą

#### Regresja

- powiązane widoki
- powiązane endpointy
- raporty i eksporty
- importy
- powiadomienia
- joby cykliczne
- integracje
- uprawnienia
- migracje

#### Security smoke

- IDOR, czyli próba dostępu do obiektu innego użytkownika przez zmianę ID
- brak roli wymaganej do operacji
- XSS w polach tekstowych
- SQL/NoSQL injection w filtrach i wyszukiwaniu
- upload pliku o złym typie
- redirect do zewnętrznego adresu
- manipulacja tenant id, user id, role albo price po stronie klienta
- powtarzanie requestu zmieniającego dane
