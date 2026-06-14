# dotnet-web-api-implementation Reference Sector: Overview

## Zawartość

- Overview
- Cel dokumentu
- Główna zasada
- Dobór architektury do rozmiaru aplikacji
- MVP i szybka iteracja
- Vertical slice
- Modularny monolit


## Cel dokumentu

Ten dokument opisuje praktyki tworzenia, utrzymywania, testowania, debugowania, skalowania i zabezpieczania aplikacji webowych API pisanych w .NET / ASP.NET Core.

Zakres dokumentu:

- aplikacje HTTP API, REST-like API, JSON API, backend-for-frontend, wewnętrzne API i publiczne API
- Minimal APIs oraz kontrolery MVC
- aplikacje od MVP po większy modularny monolit
- aplikacje rozwijane w kierunku DDD, CQRS albo podziału na usługi
- testy jednostkowe, integracyjne, kontraktowe, wydajnościowe i bezpieczeństwa
- praktyki deploymentowe widziane z poziomu aplikacji, bez powielania dokumentu infrastrukturalnego

Stan wersji na 14 czerwca 2026:

- .NET 10 jest aktualną wersją LTS i jest wspierany do listopada 2028
- .NET 9 jest aktualną wersją STS i jest wspierany do listopada 2026
- .NET 8 LTS jest wspierany do listopada 2026
- EF Core 10 jest wersją LTS związaną z .NET 10 i wymaga .NET 10 do budowania i uruchamiania[^dotnet-support][^ef10]

Dla nowych aplikacji preferuj .NET 10 LTS. Dla istniejących aplikacji na .NET 8/9 planuj upgrade przez testy regresji, analizę breaking changes, aktualizację bibliotek i sprawdzenie zachowania runtime.
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
## MVP i szybka iteracja

Dla MVP celem jest szybka dostawa bez blokowania przyszłego refactoru.

Zasady:

- zacznij od jednego projektu API
- grupuj kod po funkcjonalności, nie po typie klasy
- unikaj ciężkich abstrakcji nad każdym endpointem
- unikaj event busa, jeśli side effecty są lokalne i proste
- unikaj MediatR, jeśli endpoint wywołuje jedną metodę i nie ma pipeline'u cross-cutting
- unikaj osobnych projektów `Domain`, `Application`, `Infrastructure`, jeśli domena nie jest jeszcze znana
- utrzymuj twarde granice DTO, walidacji i dostępu do danych
- pisz testy wokół przypadków użycia, nie wokół prywatnych metod
- nie mieszaj logiki biznesowej z formatowaniem odpowiedzi HTTP
- trzymaj migracje i seed data w repozytorium od początku
- dodaj observability od pierwszej wersji produkcyjnej: structured logs, request id, health checks, metryki

Przykładowy układ dla MVP:

```text
src/
  Api/
    Program.cs
    Features/
      Orders/
        CreateOrderEndpoint.cs
        CreateOrderRequest.cs
        CreateOrderResponse.cs
        OrderValidation.cs
        OrderQueries.cs
      Users/
        GetUserEndpoint.cs
        UserDto.cs
    Infrastructure/
      AppDbContext.cs
      TimeProviderClock.cs
    Shared/
      Errors/
      Auth/
tests/
  Api.Tests/
  Api.IntegrationTests/
```

Ten układ pozwala szybko rozwijać feature'y i później przenieść części kodu do osobnych projektów bez zmiany całego sposobu myślenia o aplikacji.
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
