# dotnet-web-api-debugging Reference Sector: Migracje bazy

## Zawartość

- Migracje bazy
- Kiedy przemyśleć refactor
- Upgrade do nowszej wersji .NET

## Migracje bazy

Zasady:

- migracje są częścią release'u
- każda migracja powinna być możliwa do uruchomienia na danych produkcyjnych
- migracje długotrwałe dziel na kroki
- najpierw dodaj kompatybilny schemat, potem deploy aplikacji, potem usuń stare pola
- unikaj destructive migration bez backupu i planu rollback
- nie zakładaj, że rollback aplikacji cofnie migrację danych
- migracje powinny być idempotentne albo kontrolowane przez narzędzie migracyjne
- seed danych produkcyjnych powinien być osobny od seed danych developerskich
- testuj migrację na kopii produkcyjnych danych
- przy wielu instancjach nie uruchamiaj migracji równolegle bez locka
- indeksy na dużych tabelach twórz w sposób nieblokujący, jeśli baza to wspiera
- po migracji obserwuj slow queries, locki i error rate
## Kiedy przemyśleć refactor

Sygnały techniczne:

- zmiana jednego feature'a wymaga edycji wielu niepowiązanych miejsc
- kontrolery/endpointy mają po kilkaset linii
- logika biznesowa jest w mapperach, walidatorach albo EF query
- testy wymagają pełnego hosta dla każdej małej reguły
- duplikaty reguł pojawiają się w kilku modułach
- repository jest tylko cienką nakładką na `DbSet`
- serwisy mają nazwy typu `Manager`, `Helper`, `Processor`, ale robią wiele rzeczy
- `Common` rośnie szybciej niż moduły
- singletony przechowują stan requestu
- endpointy nie mają spójnego formatu błędów
- auth jest kopiowany ręcznie w wielu miejscach

Sygnały produktowe:

- domena zaczęła mieć nowe pojęcia i reguły
- kilka zespołów pracuje w tych samych plikach
- różne funkcjonalności wymagają osobnego release cadence
- część systemu ma dużo większy ruch niż reszta
- jeden moduł powoduje awarie całej aplikacji
- zmiany w DB blokują wiele funkcji
- publiczny kontrakt API wymaga wersjonowania

Kierunki refactoru:

- z grubych kontrolerów do application services
- z warstw technicznych do vertical slices
- z anemicznych DTO w domenie do value objects i aggregate methods
- z generycznego repository do jawnych queries i aggregate repositories
- z jednego katalogu `Services` do modułów
- z sync I/O do async
- z rozproszonego error handlingu do ProblemDetails
- z ręcznych ifów auth do policies
- z logów tekstowych do structured logs
- z lokalnych jobów do koordynowanych workerów
## Upgrade do nowszej wersji .NET

Zasady:

- śledź daty końca wsparcia target frameworka
- nie czekaj z upgrade do ostatniego miesiąca wsparcia
- najpierw upgrade SDK lokalnie i w CI
- potem zmień target framework
- potem aktualizuj ASP.NET Core, EF Core i biblioteki powiązane
- czytaj breaking changes dla wersji docelowej
- uruchom pełny test suite
- uruchom testy integracyjne z realną bazą
- sprawdź generated OpenAPI diff
- sprawdź performance smoke test
- sprawdź serialization, model binding, validation, auth i middleware
- sprawdź zachowanie logging/metrics/diagnostics
- sprawdź Dockerfile i bazowe obrazy
- sprawdź runtime w środowisku deploymentowym
- dla dużych projektów upgrade rób modułami albo przez branch stabilizacyjny
- utrzymuj `global.json` albo `rust-toolchain` odpowiednik dla .NET: `global.json`, jeśli chcesz pinować SDK
- aktualizuj analyzers i reguły CI razem z target frameworkiem

Microsoft prowadzi strony breaking changes dla każdej wersji .NET oraz dokumentację upgrade'u. Dokumentacja z 2026 wskazuje, że .NET Upgrade Assistant jest zdeprecjonowany na rzecz GitHub Copilot app modernization agent, a Upgrade Assistant można stosować, gdy modernization agent nie jest dostępny[^breaking10][^upgrade][^upgrade-assistant-deprecated].

Przykład `global.json`:

```json
{
  "sdk": {
    "version": "10.0.100",
    "rollForward": "latestFeature"
  }
}
```
