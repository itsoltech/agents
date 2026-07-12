# Codex Role Presets

Map execution policy to installation profile:

| Execution policy | Install profile |
| --- | --- |
| `economy` | `economy` |
| `standard` | `balanced` |
| `deep` | `quality` |

Choose roles by task shape: discovery uses `itsol_explorer`, narrow deterministic changes use `itsol_mechanical`, normal implementation uses `itsol_worker`, and independent review uses `itsol_reviewer`.

| Profile | Role | Model | Reasoning | Sandbox intent |
| --- | --- | --- | --- | --- |
| economy | explorer | `gpt-5.6-terra` | low | read-only |
| economy | mechanical | `gpt-5.6-terra` | low | inherit parent |
| economy | worker | `gpt-5.6-terra` | medium | inherit parent |
| economy | reviewer | `gpt-5.6` | medium | read-only |
| balanced | explorer | `gpt-5.6-terra` | medium | read-only |
| balanced | mechanical | `gpt-5.6-terra` | low | inherit parent |
| balanced | worker | `gpt-5.6` | medium | inherit parent |
| balanced | reviewer | `gpt-5.6` | high | read-only |
| quality | explorer | `gpt-5.6-terra` | medium | read-only |
| quality | mechanical | `gpt-5.6` | medium | inherit parent |
| quality | worker | `gpt-5.6` | high | inherit parent |
| quality | reviewer | `gpt-5.6` | high | read-only |

Profile thread targets are `1` for economy and `2` for balanced/quality. Every setup uses `max_depth = 1`. Existing lower values are more restrictive and remain unchanged.

These model names follow current official Codex documentation. Account entitlement is runtime-specific and remains unverified unless Codex itself confirms it during normal use; setup and doctor do not spend credits to probe it.
