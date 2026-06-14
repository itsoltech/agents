# Installing ITSOL Powers for OpenCode

## Prerequisites

- OpenCode installed

## Installation

OpenCode supports two plugin loading modes:

- local JavaScript/TypeScript plugin files in `.opencode/plugins/` or `~/.config/opencode/plugins/`
- npm packages listed in the `plugin` array of `opencode.json`

### From a Package

After publishing or otherwise making the package available to your package registry, add it to global or project-level `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["itsolpowers"]
}
```

If the package is scoped, use its scoped package name instead, for example:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@itsol/itsolpowers"]
}
```

OpenCode installs npm plugins automatically with Bun at startup and caches dependencies under its cache directory.

### From a Local Checkout

For local development, create a tiny wrapper plugin in your project-level `.opencode/plugins/` directory or global `~/.config/opencode/plugins/` directory:

```js
export {
  ItsolPowersPlugin,
  ItsolPowersPlugin as default,
} from "file://<path-to-repo>/plugins/itsolpowers/.opencode/plugins/itsolpowers.js";
```

Replace `<path-to-repo>` with the path where this repository is checked out. The wrapper imports the plugin from its package layout, so the bundled `skills/` directory still resolves correctly.

Restart OpenCode after changing plugin configuration or plugin files. The plugin registers all ITSOL skills and injects the `using-itsolpowers` router into each session.

Verify by asking:

```text
Tell me about ITSOL Powers
```

## Usage

Use OpenCode's native `skill` tool:

```text
use skill tool to list skills
use skill tool to load itsolpowers/using-itsolpowers
use skill tool to load itsolpowers/security-api-input-review
```

## Troubleshooting

### Plugin not loading

1. Check logs: `opencode run --print-logs "hello" 2>&1 | grep -i itsolpowers`
2. For npm/package installs, verify the package name in `opencode.json`.
3. For local installs, verify the wrapper file exists in `.opencode/plugins/` or `~/.config/opencode/plugins/`.
4. Restart OpenCode after changing configuration.

### Skills not found

1. Use the `skill` tool to list discovered skills.
2. Check that the plugin loaded successfully.
3. Confirm that `plugins/itsolpowers/skills/*/SKILL.md` files are present.

### Tool mapping

When ITSOL skills mention Claude Code or Codex concepts:

- `Task` or subagents -> use OpenCode's native subagent system, usually `@mention`
- `Skill` tool -> use OpenCode's native `skill` tool
- `Read`, `Write`, `Edit`, `Bash` -> use native OpenCode tools
- Claude Code plugin subagents -> delegate to OpenCode subagents with the matching ITSOL skill loaded
