# itsol-agents

Marketplace agentów dla organizacji ITSOL. Repo zawiera konfigurację marketplace dla Claude Code i Codex oraz współdzielone pluginy z komendami, skillami i agentami, które każdy w zespole może zainstalować i aktualizować.

## Claude Code

W sesji Claude Code można zainstalować marketplace przez slash command:

```
/plugin marketplace add itsoltech/agents
```

Następnie zainstaluj rekomendowany plugin:

```
/plugin install itsolpowers@itsoltech-agents
```

Alternatywnie można użyć CLI:

```
claude plugin marketplace add itsoltech/agents
claude plugin install itsolpowers@itsoltech-agents
claude plugin list
```

Po instalacji rozpocznij nową sesję Claude Code albo użyj `/reload-plugins`, żeby załadować skille, hook `SessionStart` i sub-agentów.

### Ważne: `superpowers` i `itsolpowers`

`superpowers` i `itsolpowers` wpływają na ten sam obszar pracy agenta: routing zadań, planowanie, użycie skilli, pracę sub-agentami, implementację i review. Mogą więc dawać agentowi konkurujące instrukcje.

Rekomendacja: przy korzystaniu z `itsolpowers` wyłącz `superpowers`, żeby nie mieszać agentowi workflow i nie pogarszać jakości routingu.

### Pluginy

#### itsolpowers

Rekomendowany plugin ITSOL. Zawiera skille ITSOL do routingu zadań, konfigurowalnych workflow modes, repo memory `.itsol.md`, aktualnego kontekstu technologii i dokumentacji, UI/UX frontendu, migracji technologii aplikacji, SQL Server/.NET data access, planowania funkcjonalnego, pracy sub-agentami, TDD, implementacji, debugowania, self-review, security review i infrastruktury.

```
/plugin install itsolpowers@itsoltech-agents
```

### Tryby pracy `itsol-workflow-mode`

Centralny skill `itsol-workflow-mode` rozstrzyga poziom ceremonii przed planowaniem lub implementacją:

| Tryb | Zachowanie | Stan artefaktu |
| --- | --- | --- |
| `governed` | Pełne Discovery i Decision Gates, review planów oraz jawna akceptacja każdego konkretnego planu. | `Draft`, potem `Approved` po akceptacji użytkownika |
| `autonomous-planned` | Agent tworzy i reviewuje plany, wybiera udokumentowaną rekomendację i kontynuuje bez pauz na akceptację. | `Draft`, potem `Ready for execution` po review |
| `direct` | Bez trwałych Business, Technical i Technical Fix Planów oraz ich bramek; nadal obowiązują evidence, TDD lub replacement verification i self-review. | `not-required` |

Tryb jest domyślnie ograniczony do bieżącego zadania. Kolejność rozstrzygania to: reguły platformy, `allowed_modes` i pasujące restrykcje repozytorium, jawny wybór użytkownika dla zadania, dozwolony default `.itsol.md`, a na końcu `governed`. Jawny wybór zadania może nadpisać default repo, ale nie zakaz dla ścieżki lub operacji.

Zmiana trybu dotyczy tylko pozostałej pracy i nie usuwa istniejących planów. Przejście do `governed` zatrzymuje dalszą implementację na brakujących bramkach; przejście z `governed` do trybu autonomicznego zachowuje przejrzane artefakty i usuwa tylko przyszłe pauzy akceptacyjne. `Ready for execution` nie oznacza akceptacji użytkownika — `Approved` jest zarezerwowane dla konkretnego planu, który użytkownik zobaczył i zaakceptował.

Przykładowe polecenia:

```text
Use the full governed workflow and ask me to approve each plan.

Prepare and Rubber Duck-review the plans, make the recommended decisions yourself, and continue without approval pauses until the goal is reached.

Work directly without Business, Technical, or Fix Plans; still test, verify, and review the change.
```

Samo `continue`, `do it`, milczenie albo `accept everything` bez jawnego odniesienia do bramek bieżącego zadania nie wybiera trybu autonomicznego i nie deleguje decyzji.

Opcjonalny default i ograniczenia można utrwalić w root `.itsol.md` lub najbardziej szczegółowej sekcji projektu:

```yaml
workflow:
  default_mode: governed
  allowed_modes:
    - governed
    - autonomous-planned
    - direct
  restrictions:
    - match:
        path: infra/production
      allowed_modes:
        - governed
    - match:
        operation: production-deploy
      allowed_modes:
        - governed
```

Autonomia workflow nie rozszerza zakresu zadania. Destrukcyjne operacje na danych, niezlecony deploy lub publish na produkcję, sekrety poza zakresem, zewnętrzne wiadomości lub zakupy oraz osłabienie security pozostają osobnymi pytaniami o authority. Zwykłe edycje, testy, buildy i odwracalne działania w zakresie nie tworzą nowej approval pause.

#### itsol-workflow deprecated

`itsol-workflow` jest starym pluginem i jest deprecated. Jego główne workflow zostały przeniesione i rozbudowane w `itsolpowers`.

Nie instaluj `itsol-workflow` w nowych setupach. Używaj `itsolpowers`, który zawiera nowsze workflow planowania, code review, commitów, sub-agentów i repo memory.

Stare komendy `itsol-workflow` pozostają w repo tylko dla kompatybilności z istniejącymi instalacjami:

Komendy do pracy z PR-ami, commitami i specyfikacjami.

```
/plugin install itsol-workflow@itsoltech-agents
```

Po instalacji dostępne komendy:

- `/itsol-workflow:ultra-plan` — interview do utworzenia `SPEC.md` na bazie wymagań
- `/itsol-workflow:create-commit` — commit w konwencji Angular
- `/itsol-workflow:fix-pr-review` — fix nierozwiązanych komentarzy review na PR i resolve wątków

## Aktualizacje

```
/plugin marketplace update itsoltech-agents
/plugin update itsolpowers@itsoltech-agents
```

Aktualizacje `itsolpowers` wymagają zgodnego pola `version` w `plugins/itsolpowers/package.json`, `plugins/itsolpowers/.claude-plugin/plugin.json` i `plugins/itsolpowers/.codex-plugin/plugin.json`. Przy wydaniu przez marketplace zaktualizuj również jego wersję w `.claude-plugin/marketplace.json`. Bez wymaganych bumpów klient może nie pobrać nowej wersji.

`itsol-workflow` jest deprecated, więc aktualizuj go tylko wtedy, gdy utrzymujesz starą instalację, która jeszcze go wymaga.

### Diagnostyka Claude Code

Jeśli Claude Code nie korzysta z routingu `itsolpowers`, sprawdź:

```
/plugin list
/plugin details itsolpowers@itsoltech-agents
/reload-plugins
```

W terminalu można też uruchomić:

```
claude --debug
claude plugin validate ./plugins/itsolpowers
```

W `details` plugin powinien pokazywać skille, agentów i hook `SessionStart`. Po aktualizacji pluginu rozpocznij nową sesję albo użyj `/reload-plugins`, bo zmiany w hookach i agentach nie muszą wejść do już działającej sesji.

## OpenCode

`itsolpowers` ma osobny plugin OpenCode w:

```
plugins/itsolpowers/.opencode/plugins/itsolpowers.js
```

OpenCode ładuje pluginy na dwa sposoby: lokalne pliki JS/TS z `.opencode/plugins/` lub `~/.config/opencode/plugins/`, albo paczki npm wpisane w `plugin` w `opencode.json`.

Po publikacji paczki można dodać ją do globalnego albo projektowego `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["itsolpowers"]
}
```

Do lokalnego developmentu utwórz wrapper w `.opencode/plugins/itsolpowers.js` albo `~/.config/opencode/plugins/itsolpowers.js`:

```js
export {
  ItsolPowersPlugin,
  ItsolPowersPlugin as default,
} from "file://<path-to-repo>/plugins/itsolpowers/.opencode/plugins/itsolpowers.js";
```

Po restarcie OpenCode plugin rejestruje katalog `plugins/itsolpowers/skills` i wstrzykuje router `using-itsolpowers` jako bootstrap kontekstu. Szczegóły instalacji są w:

```
plugins/itsolpowers/.opencode/INSTALL.md
```

## Codex

Instalacja w Codex:

```
/plugins
```

1. Wybierz `Add Marketplace`.
2. Dodaj marketplace:

```
itsoltech/agents
```

3. Wybierz plugin `itsolpowers`.
4. Włącz plugin i rozpocznij nową sesję, żeby załadować skille i hooki.

Jeśli masz włączony `superpowers`, wyłącz go przed użyciem `itsolpowers`.

Marketplace Codex znajduje się w:

```
.agents/plugins/marketplace.json
```

Plugin `itsolpowers` ma manifest:

```
plugins/itsolpowers/.codex-plugin/plugin.json
```

Po instalacji `itsolpowers` dostępne są skille:

- `using-itsolpowers` — routing zadań do właściwych skillów ITSOL
- `itsol-workflow-mode` — centralny kontrakt trybów `governed`, `autonomous-planned` i `direct`, precedence, stanów artefaktów, delegowania decyzji i ograniczeń repo
- `itsol-task-intake`, `itsol-repo-memory`, `itsol-current-tech-context`, `application-technology-migration`, `itsol-requirements-review`, `itsol-functional-planning`, `itsol-subagent-workflow`, `itsol-feature-implementation`, `itsol-bug-debugging`, `itsol-tdd-workflow`, `itsol-technical-planning`, `itsol-code-review-workflow`, `itsol-self-review`, `itsol-qa-handoff` — procesowe workflow pracy od wymagań, repo policy `.itsol.md`, aktualnej dokumentacji i migracji technologii, przez zależne od trybu plany lub bezpośrednią realizację, podział pracy na sub-agentów, red-green-refactor albo repo-policy replacement verification, do QA
- `security-*` — rozdrobnione skille security dla threat modelingu, auth, authz, API, frontendu, sekretów, supply chain, QA i obsługi podatności
- `infra-*` — rozdrobnione skille infrastrukturalne dla deploymentu, kontenerów, Nomada, routingu, edge protection, sekretów, obserwowalności, backupów, capacity i incidentów
- `ui-*` — framework-agnostic UI/UX frontendu: workflow, design system, architektura komponentów, stany i formularze, responsywność, Tailwind/tokeny, accessibility/motion, performance/stability, testy/QA i code review UI
- `svelte-*`, `tanstack-query-svelte-*`, `hey-api-openapi-*` — frontend, server state i klient API generowany z OpenAPI
- `dotnet-web-api-*`, `effect-typescript-*`, `rust-*`, `rust-ml-llm-*` — backend, typed TypeScript, Rust oraz aplikacje ML/LLM z Rig i Candle
- `postgres-*`, `mongodb-*`, `mssql-*` — projektowanie, review i debugowanie operacyjne baz danych

`itsol-workflow` jest dostępny w marketplace tylko jako deprecated compatibility plugin:

```
plugins/itsol-workflow/.codex-plugin/plugin.json
```

## Kontrybucje

1. Zrób fork / branch
2. Zmień pliki w `plugins/<plugin-name>/`
3. Dla `itsolpowers` zachowaj identyczne `version` w `plugins/itsolpowers/package.json`, `plugins/itsolpowers/.claude-plugin/plugin.json` i `plugins/itsolpowers/.codex-plugin/plugin.json` (SemVer: patch dla fixów, minor dla nowych komend/skilli, major dla breaking changes)
4. Jeśli zmiana jest wydawana przez marketplace, zaktualizuj także `version` w `.claude-plugin/marketplace.json`
5. Otwórz PR

### Dodawanie nowego pluginu

1. `mkdir -p plugins/<nazwa>/.claude-plugin plugins/<nazwa>/commands`
2. Utwórz `plugins/<nazwa>/.claude-plugin/plugin.json` z polami `name`, `description`, `version`, `author`
3. `mkdir -p plugins/<nazwa>/.codex-plugin plugins/<nazwa>/skills`
4. Utwórz `plugins/<nazwa>/.codex-plugin/plugin.json` z polami wymaganymi przez Codex
5. Dodaj wpisy do `plugins` w `.claude-plugin/marketplace.json` i `.agents/plugins/marketplace.json`
6. PR

### Lokalna walidacja

```
claude --plugin-dir ./plugins/<nazwa>
```

Sprawdź `/help` — komendy powinny być widoczne pod namespace `<nazwa>:`.

## Licencja

MIT.
