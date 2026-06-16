# SSRF And Outbound Requests

## SSRF i requesty wychodzące

- requesty do URL podanych przez użytkownika traktuj jako wysokie ryzyko
- blokuj adresy prywatne, loopback, link-local, metadata service i sieci wewnętrzne
- waliduj host po DNS resolution i po redirectach
- ogranicz liczbę redirectów
- pozwalaj tylko na `http` / `https`, jeśli produkt nie wymaga innych schematów
- stosuj allowlistę hostów dla integracji, jeśli jest możliwa
- nie pozwalaj użytkownikowi kontrolować nagłówków auth w requestach wychodzących
- dodawaj timeouty, limit rozmiaru odpowiedzi i limit czasu połączenia
- loguj host docelowy i wynik walidacji, ale bez sekretów

### Fuzzing i property-based tests

Stosuj dla:

- parserów plików
- importów CSV/Excel/PDF/XML/JSON
- transformacji danych
- walidatorów
- serializacji/deserializacji
- protokołów binarnych
- endpointów przyjmujących złożone filtry
- komponentów pracujących z tekstem Unicode

Testuj:

- puste dane
- bardzo długie dane
- niepoprawne kodowanie
- znaki kontrolne
- nietypowe Unicode
- zagnieżdżone struktury
- powtarzające się pola
- losową kolejność pól
- liczby skrajne
- null/undefined/brak pola

### Pliki

- upload przekraczający limit jest odrzucony
- upload z `../` w nazwie jest odrzucony
- upload z nazwą z Unicode i znakami kontrolnymi nie psuje ścieżki
- plik prywatny nie jest dostępny bez autoryzacji
- signed URL wygasa po czasie
- użytkownik nie może pobrać pliku innego tenanta
- eksport CSV nie uruchamia formuły po otwarciu w arkuszu

### Webhooki i integracje

- webhook bez podpisu jest odrzucony
- webhook z błędnym podpisem jest odrzucony
- webhook ze starym timestampem jest odrzucony
- ten sam event webhooka wysłany drugi raz nie wykonuje operacji podwójnie
- provider zwraca timeout i aplikacja obsługuje retry bez duplikacji
- provider zwraca 500 i aplikacja nie gubi joba
- provider zwraca dane w nieoczekiwanym formacie i aplikacja nie zapisuje uszkodzonych danych

### WebSockety i live eventy

- połączenie bez tokenu jest odrzucone
- połączenie z tokenem użytkownika z innego tenanta nie dostaje eventów
- subskrypcja kanału z cudzym ID jest odrzucona
- duża wiadomość od klienta jest odrzucona
- szybkie wysyłanie wiadomości uruchamia rate limit
- po odebraniu uprawnień użytkownik przestaje dostawać eventy
- duplikat eventu nie powoduje podwójnej zmiany w UI
- event poza kolejnością nie psuje stanu cache

### LLM i automatyzacja

- prompt użytkownika nie może nadpisać polityki systemowej
- model nie dostaje sekretów ani danych spoza zakresu użytkownika
- narzędzia wykonywane przez model mają minimalne uprawnienia
- każda akcja destrukcyjna wywołana przez agenta wymaga jawnej autoryzacji albo zatwierdzenia
- output modelu jest walidowany przed użyciem jako JSON, SQL, komenda, e-mail albo decyzja biznesowa
- RAG nie zwraca dokumentów z innego tenanta
- logi promptów nie zawierają sekretów i danych osobowych bez podstawy

### Integracje i joby

- czy webhook ma weryfikację podpisu
- czy retry jest idempotentny
- czy job ma limit prób
- czy job nie działa na danych, do których użytkownik stracił dostęp
- czy requesty wychodzące mają timeout i limit rozmiaru
- czy URL od użytkownika nie tworzy SSRF
