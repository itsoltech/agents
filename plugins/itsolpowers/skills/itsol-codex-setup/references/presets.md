# Codex Role Presets

Map execution policy to installation profile:

| Execution policy | Install profile |
| --- | --- |
| `economy` | `economy` |
| `standard` | `balanced` |
| `deep` | `quality` |

Choose roles by task shape: discovery uses `itsol_explorer`, narrow deterministic changes use `itsol_mechanical`, bounded implementation uses `itsol_worker`, and a requested independent review uses `itsol_reviewer`. Setup installs role definitions; it does not require every role to be invoked for every task.

| Profile | Role | Model default | Reasoning | Sandbox intent |
| --- | --- | --- | --- | --- |
| economy | explorer | `gpt-6-luna` | low | read-only |
| economy | mechanical | `gpt-6-luna` | low | inherit parent |
| economy | worker | `gpt-6.1-sol` | medium | inherit parent |
| economy | reviewer | `gpt-6.1-sol` | medium | read-only |
| balanced | explorer | `gpt-6-luna` | medium | read-only |
| balanced | mechanical | `gpt-6-luna` | low | inherit parent |
| balanced | worker | `gpt-6.1-sol` | medium | inherit parent |
| balanced | reviewer | `gpt-6.1-sol` | high | read-only |
| quality | explorer | `gpt-6-luna` | medium | read-only |
| quality | mechanical | `gpt-6-luna` | medium | inherit parent |
| quality | worker | `gpt-6-astra` | high | inherit parent |
| quality | reviewer | `gpt-6-astra` | high | read-only |

The conservative mapping keeps Luna for narrow explorer/mechanical work, GPT-6.1 Sol for bounded worker/reviewer work, and reserves Astra for quality-profile broad or high-value worker/reviewer work. The model strings are configurable defaults and advisory intent, not a guarantee of the effective runtime model or account entitlement. Codex project/user configuration and runtime selection may override them. Preserve explicit model choices; changing these defaults does not migrate an existing installation automatically.

Profile thread targets are `1` for economy and `2` for balanced/quality. Every setup uses `max_depth = 1`; nested delegation is not permitted by the managed role instructions. Existing lower values are more restrictive and remain unchanged.

Sandbox values are configured intent. Effective parent or session permissions may take precedence. Account entitlement is runtime-specific and remains unverified unless Codex itself confirms it during normal use; setup and doctor do not spend credits to probe it.

The Sol default follows the current [GPT-6.1 Sol model documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol). An offline setup check verifies configuration, not model access or inference quality.
