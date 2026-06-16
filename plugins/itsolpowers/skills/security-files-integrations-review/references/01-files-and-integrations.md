# Files And Integrations

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
