# security-files-integrations-review Reference

Ten plik jest wewnętrzną referencją skilla, wyciętą z `application-security-sdlc-qa-checklist.md` i ograniczoną do zakresu użycia tego skilla. Nie odsyłaj agenta do dokumentu źródłowego podczas normalnej pracy; używaj poniższej wiedzy bezpośrednio.

## Zakres

Review plików, object storage, webhooków, outbound HTTP, integracji, jobów, live events, WebSocket/SSE oraz automatyzacji LLM/tools.

## Przeniesione sekcje

- Upload, pliki i object storage
- Komunikacja z zewnętrznymi systemami
- WebSockety, SSE i live eventy
- SSRF i requesty wychodzące
- Testy bezpieczeństwa w development / Fuzzing i property-based tests
- Katalog scenariuszy QA / Pliki
- Katalog scenariuszy QA / Webhooki i integracje
- Katalog scenariuszy QA / WebSockety i live eventy
- Katalog scenariuszy QA / LLM i automatyzacja
- Checklist code review / Integracje i joby

## Wiedza skilla

## Upload, pliki i object storage

- każdy upload ma limit rozmiaru
- nazwa pliku od użytkownika nie może decydować o ścieżce zapisu
- normalizuj i canonicalizuj ścieżki
- blokuj path traversal, np. `../`, warianty URL-encoded i znaki kontrolne
- sprawdzaj MIME type po stronie serwera, ale nie ufaj mu jako jedynej walidacji
- pliki wykonywalne i aktywne formaty traktuj jako wysokie ryzyko
- generuj własną nazwę obiektu w storage
- oddziel bucket/prefix danych prywatnych od publicznych assetów
- dostęp do prywatnych plików realizuj przez autoryzowany endpoint albo krótkotrwały signed URL
- signed URL powinien mieć krótki TTL i minimalny zakres
- skanuj uploady antywirusowo, jeśli pliki będą pobierane przez innych użytkowników
- obrazy przetwarzaj bibliotekami odpornymi na złośliwe pliki i limity decompression bomb
- eksporty CSV zabezpiecz przed CSV injection, jeśli będą otwierane w Excelu albo podobnym narzędziu

## Komunikacja z zewnętrznymi systemami

- każda integracja ma osobny sekret albo service account
- integracje powinny mieć minimalne uprawnienia
- webhooki weryfikuj podpisem albo równoważnym mechanizmem
- webhooki muszą mieć ochronę przed replay, np. timestamp, nonce, event id
- nie wykonuj webhooka synchronicznie, jeśli provider może powtarzać requesty i powodować długie blokady
- retry powinien mieć limit, backoff i klasyfikację błędów
- błędy z providerów mapuj na własne typy błędów
- nie loguj pełnych requestów i response'ów z integracji, jeśli zawierają tokeny albo dane użytkowników
- timeouty i limity rozmiaru odpowiedzi muszą być jawne
- integracje powinny mieć circuit breaker albo ochronę przed kaskadową awarią, jeśli są używane w ścieżce requestu

## WebSockety, SSE i live eventy

- połączenie live musi być uwierzytelnione
- autoryzację sprawdzaj na connect i dla każdego typu subskrypcji
- eventy filtruj po tenant, user, roli i kanale po stronie backendu
- nie wysyłaj eventów do klienta tylko dlatego, że frontend je później odfiltruje
- sprawdzaj `Origin` dla WebSocketów z przeglądarki
- ustaw limit rozmiaru wiadomości
- ustaw heartbeat, timeout i limit liczby połączeń na użytkownika, tenant i IP
- rate limituj wiadomości od klienta
- nie pozwalaj klientowi subskrybować dowolnego kanału przez manipulację ID
- po zmianie uprawnień albo tenanta rozłącz albo odśwież subskrypcje
- eventy nie powinny zawierać więcej danych niż potrzeba do aktualizacji cache
- eventy muszą mieć `eventId`, `type`, `tenantId` albo kontekst routingu, timestamp i revision/cursor, jeśli kolejność ma znaczenie
- frontend musi obsłużyć reconnect, duplikaty, brak eventów, eventy poza kolejnością i pełny resync

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
