# dotnet-web-api-review Reference Sector: Overview

## Zawartość

- Overview
- Główna zasada
- Dobór architektury do rozmiaru aplikacji
- Vertical slice
- Modularny monolit
- Clean architecture


## Główna zasada

Architektura ma rozwiązywać obecne problemy projektu, a nie przewidywać każdą możliwą zmianę.

Dobry wybór architektury zależy od:

- tempa iteracji
- liczby osób pracujących nad kodem
- złożoności domeny
- liczby integracji zewnętrznych
- wymagań bezpieczeństwa
- wymagań wydajnościowych
- czasu życia aplikacji
- sposobu deploymentu
- kosztu refactoru w przyszłości

Nie każda aplikacja potrzebuje Clean Architecture, DDD, CQRS, MediatR, event busa, osobnych projektów dla każdej warstwy i wielu abstrakcji nad EF Core. Dla prostego CRUD taki układ może spowolnić development i utrudnić debugowanie.
## Dobór architektury do rozmiaru aplikacji

| Etap projektu | Zalecany układ | Kiedy pasuje | Kiedy jest za mało |
|---|---|---|---|
| Prototyp / MVP | jeden projekt API, vertical slices, Minimal APIs albo kontrolery | szybka walidacja produktu, mały zespół, prosta domena | gdy logika zaczyna mieszać się z I/O, a testy wymagają pełnego hosta |
| Mała aplikacja produkcyjna | jeden projekt API + osobne foldery per feature | CRUD, dashboardy, integracje, backend panelowy | gdy wiele feature'ów współdzieli reguły domenowe |
| Średnia aplikacja | modularny monolit, feature modules, osobna warstwa aplikacyjna | kilka zespołów lub wiele obszarów biznesowych | gdy moduły potrzebują osobnego skalowania albo niezależnych release'ów |
| Złożona domena | DDD wewnątrz bounded contexts, rich domain model, domain events | reguły biznesowe są zmienne i trudne | gdy większość kodu to CRUD i mapowanie danych |
| Odczyt/zapis mocno się różnią | uproszczone CQRS | inne modele dla list, raportów, komend i transakcji | gdy CQRS tworzy tylko dodatkowe klasy bez korzyści |
| System rozproszony | osobne usługi dopiero po stabilizacji granic | niezależne skalowanie, izolacja awarii, osobne zespoły | gdy podział jest robiony przed zrozumieniem domeny |
## Vertical slice

Vertical slice oznacza grupowanie kodu wokół przypadku użycia albo feature'a.

Dobre użycie:

- endpoint, request, response, walidacja i handler są blisko siebie
- zmiana feature'a wymaga otwarcia kilku plików w jednym folderze
- feature ma własne testy
- zależności feature'a są jawne
- query i command mogą mieć osobne modele, jeśli ich potrzeby są różne

Ryzyka:

- wspólne reguły biznesowe mogą zostać skopiowane do wielu slice'ów
- bez dyscypliny powstają duplikaty mapperów, walidacji i helperów
- folder feature'a może stać się mini-warstwową aplikacją bez granic
- wiele slice'ów może bezpośrednio używać DB w sprzeczny sposób

Kiedy refaktorować:

- te same reguły pojawiają się w wielu feature'ach
- zmiana jednego procesu biznesowego wymaga edycji wielu endpointów
- testy feature'ów wymagają dużego setupu, bo logika jest rozlana po infrastrukturze
- nazwy folderów zaczynają odpowiadać technicznym warstwom zamiast przypadkom użycia
## Modularny monolit

Modularny monolit to dobra ścieżka dla aplikacji większych niż MVP, ale bez kosztu mikroserwisów.

Zasady:

- moduł ma własne endpointy, przypadki użycia, model danych i testy
- moduły komunikują się przez jawne interfejsy albo zdarzenia aplikacyjne
- moduł nie sięga bezpośrednio do tabel innego modułu, jeśli moduły mają mieć realne granice
- współdzielone typy trzymaj małe i stabilne
- unikaj wspólnego katalogu `Common` jako śmietnika na wszystko
- preferuj jeden proces i jeden deployment, dopóki nie ma powodu do fizycznego podziału
- wydziel moduł do osobnej usługi dopiero wtedy, gdy jego granice są stabilne

Przykładowy układ:

```text
src/
  Api/
    Program.cs
    Modules/
      Orders/
        OrdersModule.cs
        Endpoints/
        Application/
        Domain/
        Infrastructure/
        Tests/
      Billing/
        BillingModule.cs
        Endpoints/
        Application/
        Domain/
        Infrastructure/
      Identity/
        IdentityModule.cs
        Endpoints/
        Application/
        Infrastructure/
  SharedKernel/
    Result.cs
    DomainEvent.cs
    Money.cs
```
## Clean architecture

Clean Architecture ma sens, gdy logika biznesowa jest trwała, a szczegóły infrastruktury mogą się zmieniać.

Dobre użycie:

- domena zawiera reguły niezależne od HTTP i bazy
- przypadki użycia są testowalne bez uruchamiania serwera
- warstwa aplikacyjna koordynuje procesy, ale nie zawiera szczegółów frameworka
- infrastruktura implementuje adaptery: DB, kolejki, pliki, zewnętrzne API
- zależności idą do środka, a nie z domeny do infrastruktury

Kiedy jest overkill:

- aplikacja jest prostym CRUD
- większość kodu to mapowanie DTO na tabele
- każda zmiana wymaga edycji 5 projektów i 10 plików
- interfejsy istnieją tylko dlatego, że "warstwa musi mieć interfejs"
- testy mockują EF Core zamiast testować realne zapytania
- logika biznesowa znajduje się mimo wszystko w handlerach, kontrolerach albo mapperach

Przykładowy układ dla większej aplikacji:

```text
src/
  App.Api/
  App.Application/
  App.Domain/
  App.Infrastructure/
  App.Contracts/
tests/
  App.UnitTests/
  App.IntegrationTests/
  App.ArchitectureTests/
```

Granice:

- `Api` zna `Application` i kontrakty HTTP
- `Application` zna `Domain` i abstrakcje portów
- `Domain` nie zna ASP.NET Core, EF Core, SQL, HTTP, JSON
- `Infrastructure` zna EF Core, klientów HTTP, kolejki i implementuje porty
- `Contracts` zawiera DTO używane przez klientów, jeśli projekt publikuje kontrakt
