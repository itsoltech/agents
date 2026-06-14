# itsol-technical-planning Reference Sector: Overview

## Zawartość

- Overview
- Techniczne spotkanie implementacyjne


## Techniczne spotkanie implementacyjne

Spotkanie techniczne jest potrzebne, gdy zadanie ma ryzyko architektoniczne, wpływa na kilka modułów albo wymaga uzgodnienia podejścia przed kodowaniem.

Nie każde zadanie wymaga spotkania. Dla małych zmian wystarczy komentarz w issue lub krótka notatka w PR.

### Kiedy organizować spotkanie

Spotkanie techniczne jest zalecane, gdy zmiana:

- dotyka wielu aplikacji lub usług
- zmienia model danych
- wymaga migracji danych
- zmienia API publiczne albo kontrakt integracji
- wpływa na autoryzację, role albo tenanty
- zmienia cache, eventy live, kolejki albo joby
- wymaga nowej biblioteki lub technologii
- może pogorszyć wydajność
- wymaga refaktoru
- jest trudna do rollbacku
- wymaga koordynacji kilku developerów

### Uczestnicy

Minimalny skład:

- developer odpowiedzialny za implementację
- osoba znająca obszar techniczny
- reviewer albo tech lead
- QA, jeśli zmiana ma dużo scenariuszy albo ryzyko regresji
- product owner, jeśli podczas rozmowy mogą pojawić się decyzje zakresowe

### Agenda spotkania

```markdown
# Agenda technicznego spotkania

1. Cel zadania i acceptance criteria
2. Obecne działanie systemu
3. Proponowane podejście
4. Alternatywy i powód odrzucenia
5. Zmiany w API, danych, UI, cache, eventach, integracjach
6. Bezpieczeństwo, role i tenanty
7. Migracje i kompatybilność wsteczna
8. Testy automatyczne i manualne
9. Rollout, monitoring, rollback
10. Otwarte pytania i decyzje
```

### Pytania techniczne

- Jaki jest najprostszy sposób realizacji, który spełnia wymagania?
- Czy zmiana powinna być vertical slice czy refaktorem większego modułu?
- Czy trzeba zmienić kontrakt API?
- Czy zmiana jest kompatybilna wstecznie?
- Czy stare klienty aplikacji dalej będą działały?
- Czy potrzebny jest feature flag?
- Czy dane historyczne będą poprawne po zmianie?
- Czy trzeba wykonać migrację?
- Czy migracja może działać online?
- Czy rollback jest możliwy po migracji?
- Czy zmiana wpływa na cache TanStack Query, backend cache, CDN albo browser cache?
- Czy potrzebne są eventy live albo invalidacja cache?
- Czy zmiana wpływa na kolejki, joby, retry albo idempotencję?
- Czy operacja może być wykonana dwa razy?
- Czy trzeba obsłużyć concurrency albo race condition?
- Czy funkcja działa w multi-tenant?
- Czy użytkownik może uzyskać dostęp do cudzych danych?
- Czy logi i metryki pozwolą diagnozować problem po wdrożeniu?
- Czy testy automatyczne pokryją najważniejsze ryzyka?
- Czy QA dostanie dane testowe i instrukcję testowania?

### Wynik spotkania

Po spotkaniu powinno być jasne:

- jaki wariant implementacji wybieramy
- czego nie robimy
- jakie ryzyka zostały zaakceptowane
- jakie pytania trzeba jeszcze zamknąć
- czy potrzebne są tech notes
- kto odpowiada za implementację, review i QA
