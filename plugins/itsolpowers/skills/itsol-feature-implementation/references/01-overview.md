# itsol-feature-implementation Reference Sector: Overview

## Zawartość

- Overview
- Zasada ogólna
- Wspólny proces dla każdego zadania
- Etap 4 - plan implementacji
- Etap 5 - implementacja małymi krokami
- Etap 6 - testy deweloperskie


## Zasada ogólna

Deweloper nie powinien zaczynać od pisania kodu. Pierwszym krokiem jest zrozumienie problemu, zakresu zmiany, oczekiwanego zachowania i ryzyk.

Dobre pytanie przed startem:

```text
Czy wiem, co ma się zmienić z perspektywy użytkownika, systemu i danych?
```

Jeśli odpowiedź brzmi „nie”, zadanie wymaga doprecyzowania albo własnej analizy przed implementacją.
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
## Etap 4 - plan implementacji

Plan nie musi być formalnym dokumentem. Przy większym zadaniu powinien być zapisany w komentarzu, tech notes albo opisie PR.

Dobry plan odpowiada na pytania:

```text
Jakie pliki/moduły będą zmienione?
Czy zmiana wymaga migracji danych?
Czy zmiana wymaga nowego endpointu?
Czy zmiana wymaga zmiany kontraktu API?
Czy trzeba dodać live event?
Czy trzeba zaktualizować cache po mutacji?
Jakie testy zostaną dodane?
Jak będzie sprawdzona kompatybilność wsteczna?
Jak będzie wyglądać rollback?
```

Przykładowy plan dla funkcjonalności:

```markdown
Plan:
- dodać endpoint `GET /products/{id}/price-history`
- dodać tabelę/audit log, jeśli nie istnieje
- zapisywać wpis historii przy zmianie ceny
- dodać komponent listy historii w panelu produktu
- dodać empty state
- dodać test backendowy dla zapisu historii
- dodać test frontendowy dla renderowania listy
- po zmianie ceny invalidować query `productPriceHistory(productId)`
```

Przykładowy plan dla bugfixa:

```markdown
Plan:
- odtworzyć problem na danych z ticketu
- sprawdzić, czy błąd występuje tylko dla jednostki CUBIC
- dodać test regresji na przeliczanie ceny
- znaleźć miejsce, gdzie unit mapping jest wybierany
- poprawić mapping albo fallback
- sprawdzić, czy podobny błąd występuje dla EACH i TON
- opisać przyczynę w PR
```
## Etap 5 - implementacja małymi krokami

Zmiana powinna być możliwa do zrozumienia w review. Małe, spójne zmiany są łatwiejsze do sprawdzenia i mniej ryzykowne.

Dobre praktyki:

- implementuj pionowy wycinek zamiast robić wszystkie warstwy „na ślepo”
- kompiluj i uruchamiaj testy często
- nie mieszaj refaktoru z logiką biznesową, jeśli nie jest to konieczne
- nie zmieniaj formatowania wielu plików przy okazji
- commituj logiczne fragmenty pracy
- unikaj dużych PR, które zawierają kilka tematów naraz
- zapisuj decyzje techniczne w komentarzu do zadania albo PR

Przykład pionowego wycinka:

```text
Najpierw endpoint zwracający dane.
Potem jeden prosty widok.
Potem walidacja.
Potem loading/error/empty state.
Potem testy i obsługa edge case'ów.
```

Niebezpieczny schemat:

```text
Deweloper przez kilka dni przebudowuje architekturę, ale żadna część funkcjonalności nie działa end-to-end.
```

Lepszy schemat:

```text
Deweloper dostarcza mały działający przepływ, potem rozszerza go o kolejne przypadki.
```
## Etap 6 - testy deweloperskie

Deweloper testuje własną zmianę przed oddaniem do review. QA nie powinno być pierwszym miejscem, które wykrywa oczywiste błędy.

Minimalny zakres self-testu:

- happy path
- brak danych
- błąd API
- niepoprawne dane wejściowe
- brak uprawnień
- odświeżenie strony
- ponowne wykonanie operacji
- cofnięcie/nawigacja
- edge case z istniejącymi danymi
- podstawowy test regresji dla naprawianego błędu

Pytania kontrolne:

```text
Czy sprawdziłem zmianę lokalnie?
Czy sprawdziłem zachowanie po odświeżeniu strony?
Czy sprawdziłem błąd API?
Czy sprawdziłem użytkownika bez uprawnień?
Czy sprawdziłem puste dane?
Czy sprawdziłem dane legacy?
Czy sprawdziłem, czy cache odświeża się po mutacji?
Czy testuję ten sam przypadek, który QA albo klient zgłosił?
```

Dobre zachowanie:

```text
Deweloper dodaje do PR krótką sekcję „How tested”.
```

Przykład:

```markdown
How tested:
- lokalnie utworzono produkt i zmieniono cenę 3 razy
- sprawdzono widok historii ceny
- sprawdzono użytkownika bez permission `products.price.read`
- sprawdzono empty state dla produktu bez historii
- uruchomiono `npm test` i `cargo test`
```
