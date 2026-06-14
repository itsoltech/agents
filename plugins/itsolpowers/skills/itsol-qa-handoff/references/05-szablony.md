# itsol-qa-handoff Reference Sector: Szablony

## Zawartość

- Szablony

## Szablony

### Szablon user story

```markdown
# [Obszar] Tytuł

## Cel

Jako [rola]
chcę [działanie]
aby [wartość].

## Kontekst

[opis]

## Zakres

- [element]

## Poza zakresem

- [element]

## Kryteria akceptacji

- [warunek]

## Role i uprawnienia

- [rola] może [akcja]
- [rola] nie może [akcja]

## Dane

- wymagane pola:
- walidacje:
- przykłady:

## UI / API / integracje

- [opis]

## Edge case'y

- [przypadek]

## Testy

- [scenariusz]

## Pytania otwarte

- [pytanie] - [właściciel]
```

### Szablon tech notes

```markdown
# Tech notes - [tytuł]

## Cel

## Obecny stan

## Proponowane rozwiązanie

## Alternatywy

## Zakres zmian

## API

## Dane i migracje

## Cache / eventy / kolejki

## Security

## Wydajność

## Testy

## Rollout

## Rollback

## Ryzyka

## Otwarte pytania
```

### Szablon pull requesta

```markdown
# Co zmienia PR

## Linki

- Story:
- Tech notes:

## Zakres

## Poza zakresem

## Jak testowałem

## Ryzyka

## Migracje / config

## Screenshoty / nagrania

## Notatki dla QA
```

### Szablon code review checklist

```markdown
## Zgodność

- [ ] PR realizuje acceptance criteria
- [ ] brak ukrytej zmiany zakresu

## Kod

- [ ] odpowiedzialności są w dobrych miejscach
- [ ] błędy są obsłużone
- [ ] kod jest czytelny

## Security

- [ ] autoryzacja po stronie backendu
- [ ] brak wycieku danych między tenantami
- [ ] input jest walidowany
- [ ] sekrety nie trafiają do logów ani frontendu

## Dane

- [ ] migracje są bezpieczne
- [ ] dane historyczne są obsłużone
- [ ] query mają indeksy, jeśli trzeba

## Testy

- [ ] happy path
- [ ] ścieżki błędów
- [ ] uprawnienia
- [ ] regresja

## Utrzymanie

- [ ] logi i metryki wystarczą do diagnozy
- [ ] dokumentacja zaktualizowana, jeśli potrzeba
```

### Szablon planu QA

```markdown
# Plan QA - [tytuł]

## Zakres

## Dane testowe

## Konta i role

## Happy path

## Scenariusze negatywne

## Edge case'y

## Regresja

## Security smoke

## Wynik
```

### Szablon bug reportu

```markdown
# Bug - [tytuł]

## Środowisko

## Kroki reprodukcji

## Aktualny rezultat

## Oczekiwany rezultat

## Dane testowe

## Załączniki

## Wpływ

## Severity / priority
```
