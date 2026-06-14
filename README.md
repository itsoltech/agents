# itsol-agents

Marketplace agentów dla organizacji ITSOL. Repo zawiera konfigurację marketplace dla Claude Code i Codex oraz współdzielone pluginy z komendami, skillami i agentami, które każdy w zespole może zainstalować i aktualizować.

## Claude Code

W sesji Claude Code:

```
/plugin marketplace add itsoltech/agents
```

### Pluginy

#### itsol-workflow

Komendy do pracy z PR-ami, commitami i specyfikacjami.

```
/plugin install itsol-workflow@itsoltech-agents
```

Po instalacji dostępne komendy:

- `/itsol-workflow:ultra-plan` — interview do utworzenia `SPEC.md` na bazie wymagań
- `/itsol-workflow:create-commit` — commit w konwencji Angular
- `/itsol-workflow:fix-pr-review` — fix nierozwiązanych komentarzy review na PR i resolve wątków

#### itsolpowers

Skille ITSOL do routingu zadań, planowania funkcjonalnego, pracy sub-agentami, TDD, implementacji, debugowania, self-review, security review i infrastruktury.

```
/plugin install itsolpowers@itsoltech-agents
```

## Aktualizacje

```
/plugin marketplace update itsoltech-agents
/plugin update itsol-workflow@itsoltech-agents
```

Aktualizacje są wydawane przez bump pola `version` w `plugin.json` (i w `marketplace.json`). Bez bumpa Claude Code nie pobiera nowej wersji.

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

Marketplace Codex znajduje się w:

```
.agents/plugins/marketplace.json
```

Zawiera ten sam plugin `itsol-workflow`, z manifestem:

```
plugins/itsol-workflow/.codex-plugin/plugin.json
```

Zawiera też plugin `itsolpowers`, z manifestem:

```
plugins/itsolpowers/.codex-plugin/plugin.json
```

Po instalacji dostępne są skille:

- `ultra-plan` — interview do utworzenia `SPEC.md` na bazie wymagań
- `create-commit` — commit w konwencji Angular
- `fix-pr-review` — fix nierozwiązanych komentarzy review na PR i resolve wątków
- `using-itsolpowers` — routing zadań do właściwych skillów ITSOL
- `itsol-task-intake`, `itsol-requirements-review`, `itsol-functional-planning`, `itsol-subagent-workflow`, `itsol-feature-implementation`, `itsol-bug-debugging`, `itsol-tdd-workflow`, `itsol-technical-planning`, `itsol-code-review-workflow`, `itsol-self-review`, `itsol-qa-handoff` — procesowe workflow pracy od wymagań, przez obowiązkowy Business Plan i Technical Plan, podział pracy na sub-agentów, red-green-refactor, do QA
- `security-*` — rozdrobnione skille security dla threat modelingu, auth, authz, API, frontendu, sekretów, supply chain, QA i obsługi podatności
- `infra-*` — rozdrobnione skille infrastrukturalne dla deploymentu, kontenerów, Nomada, routingu, edge protection, sekretów, obserwowalności, backupów, capacity i incidentów
- `svelte-*`, `tanstack-query-svelte-*`, `hey-api-openapi-*` — frontend, server state i klient API generowany z OpenAPI
- `dotnet-web-api-*`, `effect-typescript-*`, `rust-*`, `rust-ml-llm-*` — backend, typed TypeScript, Rust oraz aplikacje ML/LLM z Rig i Candle
- `postgres-*`, `mongodb-*` — projektowanie, review i debugowanie operacyjne baz danych

## Kontrybucje

1. Zrób fork / branch
2. Zmień pliki w `plugins/<plugin-name>/`
3. Bump `version` w `plugins/<plugin-name>/.claude-plugin/plugin.json` oraz `plugins/<plugin-name>/.codex-plugin/plugin.json` (SemVer: patch dla fixów, minor dla nowych komend/skilli, major dla breaking changes)
4. Otwórz PR

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
