# dotnet-web-api-review Reference Sector: DDD

## Zawartość

- DDD
- CQRS
- MediatR i pipeline handlers
- Minimal APIs czy kontrolery

## DDD

DDD warto stosować, gdy problem biznesowy jest trudniejszy niż sama technologia.

Dobre sygnały:

- reguły zależą od statusu, historii, roli użytkownika i wielu warunków
- model języka biznesowego jest ważniejszy niż tabele
- błędy wynikają z niespójnego rozumienia pojęć
- kilka zespołów używa tych samych słów w różnych znaczeniach
- zmiany biznesowe są częste
- procesy mają wiele invariantów

Elementy DDD:

- bounded context
- aggregate root
- entity
- value object
- domain service
- domain event
- repository dla agregatów
- ubiquitous language

Kiedy DDD jest overkill:

- aplikacja jest CRUD-em z prostymi formularzami
- domena nie ma złożonych invariantów
- główny problem to integracja z API albo raportowanie
- zespół nie ma czasu utrzymywać modelu domenowego
- model domenowy jest tylko kopią tabel

Zasady:

- aggregate root chroni invariants agregatu
- value object jest niemutowalny i walidowany przy tworzeniu
- encje nie powinny mieć publicznych setterów dla pól łamiących invariants
- domain event opisuje fakt biznesowy, nie techniczny callback
- repository ma sens głównie jako abstrakcja zapisu/odczytu agregatu
- nie twórz repository dla każdej tabeli
- nie ukrywaj każdego zapytania EF za generycznym repository, jeśli to utrudnia optymalizację

Microsoft opisuje DDD jako podejście do modelowania trudnych obszarów biznesowych przez bounded contexts i język domenowy[^ddd]. Repository w tym podejściu służy do oddzielenia modelu domenowego od szczegółów persystencji, nie jako mechaniczne opakowanie CRUD nad każdą tabelą[^repository].
## CQRS

CQRS rozdziela model zapisu od modelu odczytu. Nie musi oznaczać osobnych baz, event sourcingu ani mikroserwisów.

Dobre użycie:

- odczyty mają inny kształt niż zapis
- listy, dashboardy i raporty wymagają zoptymalizowanych projekcji
- komendy mają reguły biznesowe, a query są prostymi odczytami
- cache i invalidacja są inne dla odczytu niż dla zapisu
- endpointy zapisu i odczytu mają różne SLA

Prosty CQRS:

```text
Orders/
  Commands/
    CreateOrder/
    CancelOrder/
  Queries/
    GetOrderDetails/
    SearchOrders/
```

Kiedy CQRS jest overkill:

- command i query używają tych samych DTO i tych samych tabel
- każda operacja CRUD dostaje parę klas bez realnej różnicy
- handler tylko przekazuje wywołanie do repository
- rozdzielenie zwiększa liczbę plików, ale nie upraszcza kodu

Zasady:

- query nie powinno zmieniać stanu
- command powinien zwracać minimalny wynik: ID, status, wersję, błędy
- query może zwracać model zoptymalizowany pod UI
- nie mieszaj transakcji zapisu z długimi operacjami odczytu
- przy osobnych projekcjach opisz opóźnienie eventual consistency
## MediatR i pipeline handlers

MediatR może pomóc, jeśli projekt ma wiele przypadków użycia i potrzebuje wspólnych pipeline'ów.

Dobre użycie:

- walidacja, logging, metrics, transaction behavior, authorization są powtarzalne
- przypadki użycia są testowane poza HTTP
- zespół akceptuje dodatkową warstwę pośrednią
- komendy i query mają jasne kontrakty

Kiedy jest overkill:

- endpoint wywołuje jedną metodę i nic więcej
- zespół debugguje przez skakanie po wielu handlerach
- pipeline handlers ukrywają zachowanie wymagane do zrozumienia requestu
- MediatR jest użyty tylko dlatego, że projekt wygląda wtedy "enterprise"

Zasady:

- nie wrzucaj logiki biznesowej do pipeline handlerów
- pipeline handler powinien robić cross-cutting concern
- handler powinien mieć jedną odpowiedzialność
- jeśli handler ma 200 linii, problemem nie jest brak kolejnej warstwy
- jeśli request/response są publicznym kontraktem API, nie mieszaj ich bezpośrednio z command/query używanym wewnętrznie
## Minimal APIs czy kontrolery

Minimal APIs pasują do:

- małych i średnich API
- endpointów feature-oriented
- micro-API, BFF, internal services
- projektów, gdzie routing i handler mają być blisko siebie
- szybkiego MVP
- funkcji z małą liczbą filtrów MVC

Kontrolery pasują do:

- większych API z konwencjami MVC
- zespołów przyzwyczajonych do atrybutów i filtrów
- aplikacji z rozbudowanym model bindingiem
- projektów z dużą liczbą istniejących kontrolerów
- gdy generacja OpenAPI i dokumentacja są już oparte na kontrolerach

Zasady wspólne:

- endpoint nie powinien zawierać złożonej logiki biznesowej
- endpoint mapuje HTTP na przypadek użycia
- endpoint waliduje dane wejściowe albo wywołuje walidator
- endpoint mapuje wynik domenowy na status HTTP
- endpoint nie powinien bezpośrednio znać szczegółów wielu integracji
- nie mieszaj Minimal APIs i kontrolerów bez powodu w jednym module

ASP.NET Core wspiera Minimal APIs, endpoint filters, route groups, authorization i validation. W .NET 10 Minimal APIs mają stabilne top-level `AddValidation` oraz wbudowany validation filter, z możliwością dostosowania odpowiedzi przez `IProblemDetailsService`[^minimal-apis][^minimal-filters].
