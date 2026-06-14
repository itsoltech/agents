# itsol-task-intake Reference Sector: Overview

## Zawartość

- Overview
- Cel dokumentu
- Zasada ogólna
- Dwa tryby pracy
- Wspólny proces dla każdego zadania
- Decyzja o sub-agentach
- Etap 1 - zrozumienie zadania


## Cel dokumentu

Ten dokument opisuje praktyczny sposób pracy dewelopera nad dwoma typami zadań:

- nowa funkcjonalność
- naprawa błędu

Oba typy zadań wymagają innego sposobu myślenia. Przy nowej funkcjonalności deweloper buduje zmianę, która ma dowieźć zachowanie opisane w historyjce. Przy naprawie błędu deweloper najpierw musi zrozumieć, co faktycznie się stało, odtworzyć problem, znaleźć przyczynę i dopiero później przygotować poprawkę.

Dokument ma pomagać mniej doświadczonym deweloperom w budowaniu dobrych nawyków: jak czytać zadanie, jakie pytania zadawać, jak planować pracę, jak nie zgubić edge case'ów, jak debugować, kiedy poprosić o pomoc, jak sprawdzić własny kod przed review i jak przygotować zadanie do QA.
## Zasada ogólna

Deweloper nie powinien zaczynać od pisania kodu. Pierwszym krokiem jest zrozumienie problemu, zakresu zmiany, oczekiwanego zachowania i ryzyk.

Dobre pytanie przed startem:

```text
Czy wiem, co ma się zmienić z perspektywy użytkownika, systemu i danych?
```

Jeśli odpowiedź brzmi „nie”, zadanie wymaga doprecyzowania albo własnej analizy przed implementacją.
## Dwa tryby pracy

### Nowa funkcjonalność

Nowa funkcjonalność zaczyna się od intencji biznesowej albo produktowej. Deweloper musi przełożyć ją na działający fragment systemu.

Celem jest:

- zrozumieć, kto korzysta z funkcji
- zrozumieć, jaki problem rozwiązuje funkcja
- zrozumieć, jakie zachowanie jest oczekiwane
- wybrać najmniejszy sensowny zakres implementacji
- nie nadbudować architektury ponad aktualną potrzebę
- zostawić kod w stanie, który da się rozwijać

Przykładowe zadanie:

```text
Jako manager restauracji chcę widzieć historię zmian ceny produktu, aby sprawdzić, kto i kiedy zmienił cenę.
```

Deweloper powinien myśleć o przepływie:

```text
Kto otwiera widok?
Jakie dane widzi?
Skąd dane pochodzą?
Kiedy dane się zmieniają?
Jak wygląda brak danych?
Jak wygląda błąd API?
Jakie uprawnienia są wymagane?
Jak to przetestować?
```

### Naprawa błędu

Bugfix zaczyna się od niezgodności między oczekiwanym a faktycznym zachowaniem. Deweloper nie powinien zgadywać poprawki bez odtworzenia problemu albo bez mocnych dowodów z logów, danych, testów lub analizy kodu.

Celem jest:

- ustalić fakty
- odtworzyć problem
- zawęzić obszar awarii
- znaleźć przyczynę, a nie tylko objaw
- naprawić najmniejszy bezpieczny fragment
- dodać test regresji
- sprawdzić, czy błąd nie występuje w innych podobnych miejscach

Przykładowy błąd:

```text
Po zmianie jednostki materiału z EACH na CUBIC cena w estymacie jest liczona niepoprawnie.
```

Deweloper powinien myśleć o ścieżce:

```text
Czy problem dotyczy UI, API, danych, cache, modelu, migracji czy integracji?
Czy potrafię go odtworzyć?
Jakie dane wejściowe są potrzebne?
Jaki wynik jest oczekiwany?
Od kiedy problem występuje?
Czy istnieje commit, migracja albo deploy, po którym pojawił się błąd?
Czy poprawka naprawia przyczynę, czy tylko maskuje objaw?
```
## Wspólny proces dla każdego zadania

Każde zadanie, niezależnie od typu, powinno przejść przez te etapy:

```text
1. Zrozumienie zadania
2. Doprecyzowanie braków
3. Analiza wpływu na system
4. Plan implementacji
5. Implementacja małymi krokami
6. Testy deweloperskie
7. Self-review
8. Pull request
9. Reakcja na code review
10. Handoff do QA
11. Wsparcie QA i poprawki
12. Zamknięcie zadania z jasnym zakresem zmian
```

Nie każdy etap musi być długi. Przy małym zadaniu analiza może zająć kilka minut. Przy zmianie w danych, płatnościach, autoryzacji, cache, synchronizacji albo integracjach zewnętrznych analiza powinna być dokładniejsza.
## Decyzja o sub-agentach

Podczas intake agent powinien sprawdzić, czy zadanie da się bezpiecznie podzielić na niezależne strumienie pracy. Dobrymi kandydatami są osobne powierzchnie UI/API/database/infra, niezależne hipotezy debuggingowe, review kilku modułów, osobna analiza security albo zbieranie dowodów z logów, konfiguracji i kodu.

Sub-agent powinien dostać wąski zakres, listę plików lub obszar systemu, ograniczenia oraz oczekiwany wynik. Główny agent odpowiada za decyzje przekrojowe, integrację odpowiedzi, finalne zmiany i weryfikację. Jeśli kilka osób lub agentów musiałoby edytować ten sam plik, sub-agent powinien raportować analizę zamiast pisać kod.
## Etap 1 - zrozumienie zadania

Przed kodowaniem deweloper powinien przeczytać:

- tytuł
- opis
- acceptance criteria
- komentarze
- załączniki
- makiety
- logi
- linki do powiązanych zadań
- poprzednie decyzje techniczne
- obecne zachowanie systemu

Pytania kontrolne:

```text
Co dokładnie ma zostać dostarczone?
Co nie jest częścią tego zadania?
Kto będzie używał tej funkcji?
Jaki jest oczekiwany efekt końcowy?
Czy istnieją acceptance criteria?
Czy są przykłady danych wejściowych i wyjściowych?
Czy zadanie dotyka bezpieczeństwa, danych, płatności, uprawnień albo integracji?
Czy jest deadline, zależność od innego zadania albo ryzyko deploymentowe?
```

Zachowanie dobre:

```text
Deweloper zapisuje brakujące pytania w komentarzu do zadania albo na technicznym spotkaniu.
```

Zachowanie złe:

```text
Deweloper zaczyna implementować na podstawie samego tytułu zadania.
```
