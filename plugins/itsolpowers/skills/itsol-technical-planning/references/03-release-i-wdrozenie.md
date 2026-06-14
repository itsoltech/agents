# itsol-technical-planning Reference Sector: Release i wdrożenie

## Zawartość

- Release i wdrożenie
- Checklist dla spotkania technicznego

## Release i wdrożenie

Nie każde zadanie wymaga osobnego planu release. Zmiany ryzykowne powinny mieć jednak opisane wdrożenie.

### Pytania przed release

- Czy zmiana jest za feature flagiem?
- Czy migracja jest kompatybilna wstecznie?
- Czy stare wersje aplikacji będą działały po wdrożeniu backendu?
- Czy można wdrożyć backend przed frontendem?
- Czy rollback wymaga cofnięcia migracji?
- Czy QA przetestowało build, który będzie wdrażany?
- Czy support wie, jak rozpoznać problem?
- Jakie logi i metryki obserwujemy po wdrożeniu?
- Kto podejmuje decyzję o rollbacku?

### Plan release dla zmiany ryzykownej

```markdown
# Plan release

## Zakres

Co wdrażamy.

## Kolejność

1. migracja bezpieczna wstecznie
2. backend
3. frontend
4. włączenie feature flag

## Walidacja po wdrożeniu

- check 1
- check 2

## Monitoring

- metryka 1
- log 1
- alert 1

## Rollback

Jak wrócić do poprzedniego stanu.

## Osoby odpowiedzialne

- release owner:
- developer:
- QA:
- product:
```
## Checklist dla spotkania technicznego

- czy znamy obecne działanie systemu?
- czy wiemy, które moduły się zmienią?
- czy są alternatywy implementacji?
- czy wybraliśmy najprostsze bezpieczne podejście?
- czy zmiana dotyka danych lub migracji?
- czy zmiana dotyka uprawnień?
- czy zmiana dotyka cache, eventów, kolejek albo integracji?
- czy znamy plan testów?
- czy znamy plan rollout i rollback?
- czy zapisaliśmy decyzje?
