# itsol-task-intake Reference Sector: Etap 2 - doprecyzowanie braków

## Zawartość

- Etap 2 - doprecyzowanie braków
- Etap 3 - analiza wpływu na system
- Kiedy prosić o pomoc
- Komunikacja statusu
- Czerwone flagi podczas pracy

## Etap 2 - doprecyzowanie braków

Nie każde zadanie jest gotowe do implementacji. Braki trzeba ujawnić wcześnie.

Typowe braki:

- niejasna rola użytkownika
- brak opisu oczekiwanego zachowania
- brak informacji o błędach i pustych stanach
- brak kryteriów akceptacji
- brak danych testowych
- niejasne uprawnienia
- niejasne reguły walidacji
- niejasna kompatybilność wsteczna
- brak informacji o migracji danych
- brak decyzji, czy zmiana ma działać w mobile, desktop, API, workerze albo panelu admina

Pytania do właściciela produktu, lidera technicznego albo QA:

```text
Czy ta zmiana dotyczy wszystkich użytkowników czy tylko wybranej roli?
Czy stare dane mają zostać obsłużone?
Jak ma wyglądać zachowanie, gdy API zwróci błąd?
Czy użytkownik może cofnąć tę operację?
Czy operacja ma być audytowana?
Czy zmiana ma wpływać na istniejące raporty, eksporty, powiadomienia albo integracje?
Czy jest przypadek, w którym przycisk powinien być niewidoczny, zablokowany albo dostępny tylko warunkowo?
Czy walidacja ma być po stronie frontendu, backendu, czy obu stron?
Czy są dane produkcyjne, które mogą nie spełniać nowej reguły?
```

Jeśli braki blokują pracę, deweloper powinien to zapisać w zadaniu. Jeśli braki nie blokują całej pracy, można zacząć od części niezależnej.
## Etap 3 - analiza wpływu na system

Przed zmianą trzeba sprawdzić, gdzie system może zostać dotknięty.

Lista obszarów:

- UI
- routing
- formularze
- API
- walidacja
- uprawnienia
- baza danych
- migracje
- cache
- websocket live eventy
- kolejki i workery
- logi i metryki
- integracje zewnętrzne
- testy
- dokumentacja
- deployment
- kompatybilność z istniejącymi klientami API

Pytania kontrolne:

```text
Czy ta zmiana dotyka tylko jednego widoku, czy wielu ścieżek?
Czy istnieje drugi endpoint, który robi podobną rzecz?
Czy jest job asynchroniczny, który korzysta z tych samych danych?
Czy frontend cache będzie wymagał invalidacji?
Czy live eventy muszą odświeżyć widok użytkownika?
Czy migracja danych jest potrzebna?
Czy stare rekordy mają brakujące pola?
Czy API jest używane przez inne aplikacje?
Czy zmiana może złamać import, eksport albo raport?
Czy w systemie jest multi-tenant i trzeba pilnować izolacji danych?
```

Dobre zachowanie:

```text
Deweloper znajduje podobne implementacje i sprawdza, czy może zachować spójny styl.
```

Złe zachowanie:

```text
Deweloper implementuje nowy przepływ jako trzeci wariant tego samego mechanizmu bez sprawdzenia istniejących rozwiązań.
```
## Kiedy prosić o pomoc

Proszenie o pomoc nie jest porażką. Problemem jest długie blokowanie pracy bez komunikacji.

Poproś o pomoc, gdy:

- nie rozumiesz celu zadania
- brakuje danych do reprodukcji
- nie możesz odtworzyć błędu
- utknąłeś na tej samej hipotezie
- zmiana dotyka obszaru, którego nie znasz
- istnieje ryzyko uszkodzenia danych
- zmiana dotyka bezpieczeństwa
- fix wymaga decyzji produktowej
- rozwiązanie zaczyna być dużo większe niż zadanie

Dobry komunikat do zespołu:

```text
Utknąłem na bugfixie dotyczącym przeliczania ceny.
Sprawdziłem:
- request z UI zawiera poprawną jednostkę
- API zapisuje jednostkę poprawnie
- po reloadzie dane z API są poprawne
- zły stan pojawia się po live event `estimate.updated`

Moja hipoteza:
event nadpisuje cache starszą wersją estimate.

Potrzebuję pomocy w sprawdzeniu mechanizmu revision/event ordering.
```

Słaby komunikat:

```text
Nie działa, ktoś pomoże?
```
## Komunikacja statusu

Deweloper powinien komunikować stan pracy, gdy zadanie jest niejasne, ryzykowne albo się przedłuża.

Dobry status:

```text
Status:
- implementacja endpointu gotowa
- frontend pokazuje dane i empty state
- zostało: obsługa permission denied i test regresji
- ryzyko: obecne API nie zwraca `changedBy`, potrzebna decyzja czy dodać pole teraz
```

Status przy bugfixie:

```text
Status:
- problem odtworzony lokalnie
- przyczyna: brak invalidacji `estimateDetails(id)` po zmianie jednostki
- fix gotowy
- dodaję test regresji
- sprawdzam analogiczne mutacje
```

Status, gdy deweloper jest zablokowany:

```text
Bloker:
Nie da się potwierdzić oczekiwanego zachowania dla starych rekordów bez `unitAliasId`.
Potrzebna decyzja:
- pokazać rekord jako unknown
- ukryć rekord
- wykonać migrację danych
```
## Czerwone flagi podczas pracy

Deweloper powinien zatrzymać się i doprecyzować zadanie, gdy:

- kod zaczyna dotykać dużo większego zakresu niż opis zadania
- wymagane jest obejście braku decyzji produktowej
- poprawka wymaga ręcznej zmiany danych produkcyjnych
- logika bezpieczeństwa jest niejasna
- zmiana wpływa na płatności, raporty, rozliczenia albo uprawnienia
- nie da się napisać testu, bo odpowiedzialności są wymieszane
- deweloper nie umie powiedzieć, jak sprawdzić poprawność
- nowa funkcja wymaga zmiany kontraktu API używanego przez inne aplikacje
- bugfix wymaga zgadywania bez danych
- PR robi kilka niepowiązanych rzeczy
