# security-qa-scenarios Reference Sector: Jak wymyślać scenariusze testowe

## Zawartość

- Jak wymyślać scenariusze testowe

## Jak wymyślać scenariusze testowe

### Perspektywa aktora

Dla każdej funkcji sprawdź zachowanie jako:

- niezalogowany użytkownik
- użytkownik zalogowany bez roli
- użytkownik z najniższą rolą
- użytkownik z rolą tylko do odczytu
- użytkownik z rolą admin w innym tenancie
- użytkownik z usuniętym albo zablokowanym kontem
- użytkownik po zmianie roli w trakcie sesji
- operator supportu
- integracja zewnętrzna
- worker wykonujący job asynchroniczny
- skrypt wykonujący setki requestów

### Perspektywa obiektu

Dla każdego obiektu domenowego sprawdź:

- odczyt własnego obiektu
- odczyt obcego obiektu
- odczyt obiektu z innego tenanta
- edycję obiektu w stanie zamkniętym
- usunięcie obiektu używanego przez inne dane
- eksport obiektu
- wysłanie obiektu do integracji
- dostęp po soft-delete
- dostęp przez stare linki
- dostęp przez ID z logów, URL albo eventów

### Perspektywa granicy zaufania

Dla każdej granicy sprawdź:

- browser -> API
- API -> baza danych
- API -> object storage
- API -> zewnętrzny provider
- webhook -> API
- worker -> API/internal service
- admin panel -> API
- WebSocket -> event stream
- frontend cache -> widok użytkownika
- CI/CD -> registry/secrets

Pytania:

- co przychodzi z niezaufanej strony
- co jest podpisane albo uwierzytelnione
- co może zostać powtórzone
- co może zostać podmienione
- co może wyciec do logów
- co dzieje się przy timeout
- co dzieje się przy częściowej awarii

### Perspektywa stanu

Dla workflow sprawdź:

- akcję wykonaną dwa razy
- akcję wykonaną w złej kolejności
- akcję po anulowaniu
- akcję po wygaśnięciu tokenu
- akcję po odebraniu uprawnień
- akcję równoległą z dwóch kart
- akcję wykonaną po rollbacku UI
- akcję wykonaną przez retry klienta
- akcję wykonaną po retry kolejki

### Perspektywa danych wejściowych

Dla każdego pola sprawdź:

- brak pola
- `null`
- pusty string
- bardzo długi string
- znaki kontrolne
- Unicode, emoji, znaki łączone, RTL
- whitespace na początku i końcu
- HTML i skrypt
- SQL metacharacters
- path traversal
- URL encoded i double encoded wartości
- liczby ujemne
- zero
- wartości powyżej limitu
- float zamiast integer
- scientific notation
- duplikaty w tablicach
- tablice z tysiącami elementów
- obiekty z dodatkowymi polami

### Perspektywa czasu

Sprawdź:

- wygasły token
- token użyty przed `nbf`
- różnice czasu między usługami
- link resetu użyty po zmianie hasła
- zaproszenie użyte po odebraniu uprawnień zapraszającemu
- retry po sukcesie
- job wykonany po usunięciu obiektu
- event live otrzymany po zmianie tenanta
- cache z poprzedniej wersji aplikacji

### Perspektywa limitów

Sprawdź:

- zbyt duży upload
- zbyt duży JSON
- za dużo elementów w batchu
- bardzo szeroką paginację
- głęboki offset
- długie sortowanie po kosztownym polu
- kosztowny filtr
- bardzo dużo połączeń WebSocket
- bardzo dużo requestów resetu hasła
- bardzo dużo błędnych prób MFA
- zbyt częste webhooki
