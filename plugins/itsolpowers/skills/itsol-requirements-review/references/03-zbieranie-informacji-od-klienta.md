# itsol-requirements-review Reference Sector: Zbieranie informacji od klienta

## Zawartość

- Zbieranie informacji od klienta
- Dokumentowanie ustaleń

## Zbieranie informacji od klienta

Zbieranie wymagań nie jest jednorazową fazą. Wymagania dojrzewają podczas rozmów, prototypowania, implementacji, testów i feedbacku z produkcji. Trzeba jednak rozdzielić dwie rzeczy: naturalne doprecyzowanie od zmiany zakresu. Doprecyzowanie wyjaśnia istniejący cel. Zmiana zakresu dodaje nowy cel, nowe przypadki użycia albo nowe ograniczenia.

### Cel rozmowy z klientem

Rozmowa z klientem powinna doprowadzić do odpowiedzi:

- jaki problem ma zostać rozwiązany
- kto ma problem
- jak proces działa dzisiaj
- co ma się zmienić po wdrożeniu
- jak klient rozpozna, że zadanie zostało wykonane poprawnie
- jakie dane, role, uprawnienia, integracje i ograniczenia wpływają na rozwiązanie
- co jest poza zakresem
- kto podejmuje decyzje, jeśli pojawią się sprzeczności

### Pytania o cel biznesowy

- Jaki problem próbujemy rozwiązać?
- Co dzisiaj nie działa albo zabiera za dużo czasu?
- Kto dokładnie korzysta z tego procesu?
- Jak wygląda obecny proces krok po kroku?
- Jakie decyzje użytkownik podejmuje w tym procesie?
- Co będzie miernikiem sukcesu?
- Co stanie się, jeśli tej zmiany nie zrobimy?
- Czy to jest potrzeba jednego klienta, jednej roli, jednego działu czy wszystkich użytkowników?
- Czy istnieją dokumenty, procedury, maile albo przykłady pokazujące oczekiwane działanie?
- Czy są przypadki, których system nie powinien obsługiwać w tym etapie?

### Pytania o użytkowników i role

- Kto będzie korzystał z tej funkcji?
- Jakie role mają mieć dostęp?
- Kto może tworzyć, odczytywać, edytować, usuwać albo zatwierdzać dane?
- Czy użytkownik może zobaczyć dane innych użytkowników, zespołów, klientów albo tenantów?
- Czy istnieją role administracyjne albo wyjątki od standardowych zasad?
- Czy dostęp zależy od statusu obiektu, właściciela, lokalizacji, organizacji albo czasu?
- Czy działanie ma być auditowane?
- Czy użytkownik powinien dostać informację, dlaczego nie ma dostępu?

### Pytania o dane

- Jakie dane są wymagane?
- Jakie pola są opcjonalne?
- Jakie są typy danych, zakresy wartości, limity długości i formaty?
- Czy dane mogą być puste, nieznane albo częściowe?
- Czy istnieją dane historyczne, które nie spełniają nowych reguł?
- Czy trzeba migrować istniejące dane?
- Czy dane są wrażliwe, osobowe, finansowe albo objęte audytem?
- Jak długo dane mają być przechowywane?
- Czy dane mogą być usuwane fizycznie, czy tylko archiwizowane?
- Czy dane muszą być eksportowane albo importowane?
- Jak wygląda przykład poprawnych danych?
- Jak wygląda przykład danych błędnych?

### Pytania o proces i stany

- Jakie statusy może mieć obiekt?
- Jakie przejścia między statusami są dozwolone?
- Kto może zmienić status?
- Czy można cofnąć zmianę?
- Czy operacja jest jednorazowa, czy można ją powtarzać?
- Co ma się stać, jeśli dwie osoby wykonają operację jednocześnie?
- Co ma się stać, jeśli proces zostanie przerwany w połowie?
- Czy potrzebny jest draft, wersjonowanie albo historia zmian?
- Czy użytkownik powinien dostać powiadomienie?
- Czy zdarzenie powinno wywołać integrację z innym systemem?

### Pytania o integracje

- Z jakimi systemami integruje się zmiana?
- Który system jest źródłem prawdy?
- Jak wygląda kontrakt API albo format pliku?
- Czy integracja jest synchroniczna, asynchroniczna, batchowa albo eventowa?
- Jakie są limity API, rate limits i timeouty?
- Jak obsłużyć retry?
- Jak wykryć duplikaty?
- Co zrobić, jeśli system zewnętrzny nie odpowiada?
- Czy istnieje sandbox albo środowisko testowe?
- Czy klient może dostarczyć przykładowe requesty, response'y i błędy?
- Czy integracja wymaga certyfikatów, sekretów albo whitelisty IP?

### Pytania o UI i UX

- Czy istnieją makiety albo aktualny ekran, który zmieniamy?
- Czy funkcja ma działać na mobile, desktopie czy obu?
- Jak użytkownik ma dostać feedback po sukcesie, błędzie i braku uprawnień?
- Czy użytkownik może opuścić ekran z niezapisanymi zmianami?
- Czy operacja może trwać długo?
- Czy potrzebny jest progress, loading state, retry albo cancel?
- Czy tabela wymaga sortowania, filtrowania, paginacji albo wyszukiwania?
- Jak obsługiwać puste stany?
- Jak obsługiwać bardzo duże zbiory danych?
- Czy wymagane są tłumaczenia?

### Pytania o wymagania niefunkcjonalne

- Jaki jest akceptowalny czas odpowiedzi?
- Ilu użytkowników może wykonywać tę operację jednocześnie?
- Jak duże mogą być dane wejściowe?
- Czy operacja musi być idempotentna?
- Czy wynik musi być natychmiast spójny, czy wystarczy eventual consistency?
- Czy funkcja ma działać offline albo przy słabym połączeniu?
- Czy potrzebne są logi, metryki, alerty albo audyt?
- Czy funkcja wpływa na koszty infrastruktury albo providerów zewnętrznych?
- Czy są wymagania prawne, zgodnościowe albo bezpieczeństwa?

### Pytania o rollout i utrzymanie

- Czy funkcja ma być dostępna dla wszystkich od razu?
- Czy potrzebny jest feature flag?
- Czy rollout ma być per tenant, per user, per role albo per environment?
- Czy da się bezpiecznie wyłączyć funkcję po wdrożeniu?
- Czy zmiana wymaga komunikacji do użytkowników?
- Czy support musi dostać instrukcję obsługi problemów?
- Jak sprawdzimy po wdrożeniu, że wszystko działa?
- Jakie metryki albo logi należy obserwować?

### Sygnały ostrzegawcze podczas zbierania wymagań

- klient opisuje rozwiązanie, ale nie potrafi opisać problemu
- każda rola ma mieć inne wyjątki, ale nie ma matrycy uprawnień
- wymaganie używa słów „zawsze”, „nigdy”, „automatycznie”, ale nie opisuje wyjątków
- brakuje przykładowych danych
- brakuje osoby decyzyjnej po stronie klienta
- zakres rośnie podczas rozmowy bez zmiany priorytetu lub terminu
- wymaganie zależy od systemu zewnętrznego, do którego nikt nie ma dostępu
- oczekiwanie dotyczy migracji danych, ale nie ma próbki danych historycznych
- funkcja ma wpływ na bezpieczeństwo, ale nie ma opisanych ról i uprawnień
- klient oczekuje zachowania „tak jak obecnie”, ale obecne działanie nie jest spisane
## Dokumentowanie ustaleń

Po rozmowie z klientem powinien powstać krótki zapis ustaleń. Nie musi być długi, ale musi usuwać niejednoznaczność.

Minimalna notatka po rozmowie:

```markdown
# Notatka z ustaleń

## Kontekst

- Data:
- Uczestnicy:
- Link do nagrania / wątku / maila:
- Dotyczy:

## Problem

Krótki opis problemu biznesowego.

## Oczekiwany rezultat

Co ma być możliwe po wdrożeniu.

## Ustalenia

- decyzja 1
- decyzja 2
- decyzja 3

## Otwarte pytania

- pytanie 1 - właściciel odpowiedzi - termin
- pytanie 2 - właściciel odpowiedzi - termin

## Poza zakresem

- element 1
- element 2

## Materiały

- link do makiety
- link do przykładowych danych
- link do dokumentacji API
```

Zasada: jeśli decyzja wpływa na implementację, testy albo akceptację, musi zostać zapisana w story, komentarzu, tech notes albo ADR.
