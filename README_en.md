<div align="center">

# AIOS

### A personal operating system framework for the AI era

Open source · Local-first · Everything is an app · AI-native

<br />

[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.5-43853d.svg)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey.svg)](#quick-start)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white)](https://discord.gg/YfCbV3m9Q)
[![Stars](https://img.shields.io/github/stars/realuckyang/AIOS?style=social)](https://github.com/realuckyang/AIOS)

[简体中文](./README.md) · [English](./README_en.md)

<!-- Screenshot slot: update once the framework UI is finalized -->
<img src="https://iimos.ai/blog/iimos-screenshots/images/readme-overview.webp" alt="AIOS Screenshot" width="100%" />

</div>

---

AIOS is an open-source framework that hosts full-stack apps you build together with AI, on top of a minimal set of system conventions. Every app has its own frontend, backend, and dedicated database; all data stays on your machine; AI can write apps for you, and apps can call AI as a service.

## Core idea: everything is an app

AIOS has no "system UI" in the traditional sense. **Chat, tasks, and settings are all apps**, listed in the same registry as notepad, todo, and ledger. The system layer owns exactly two things:

1. **A global top bar**: the current app's registered action and title on the left, a grid button on the right that opens the app panel for switching apps.
2. **Shell state**: the current app and a hash route (`#/app/:id`).

Everything below the top bar belongs to the app — layout, style, and interaction are fully its own. The system is shrunk to a minimum; the freedom goes to the apps.

Three consequences follow:

- **Chat is not special.** It is just the default app. The kernel (agent loop, tasks, memory) is fully decoupled from the UI — you can skip our chat interface and use only the kernel.
- **Settings follows the standard contract.** Its own backend, its own database, its own APP.md — the kernel opens no backdoor for it.
- **The framework fits in three phrases**: kernel services + app contract + one top bar/panel.

## Quick start

Requires Node.js >= 22.5.

```bash
git clone https://github.com/realuckyang/AIOS.git
cd AIOS
npm install
npm start
```

Open **`http://localhost:9502`**, go to Settings, and add an API key for any OpenAI-compatible endpoint.

Frontend dev with hot reload: `npm run ui` (Vite, `http://localhost:5173`). Ports are configurable via `AGENT_PORT` (default 9502) and `AGENT_APPS_PORT` (default 9503).

## Writing an app

An app = a frontend directory + a layered backend + one APP.md. Don't invent new structure — copy an existing app (notepad is the most complete).

**Frontend** `ui/src/apps/<id>/`:

```text
index.vue       Entry: holds app state and actions, assembles views
views/          Screen-level views
components/     Small reusable pieces within the app
lib/            api.js (fetch wrapper) + format.js (pure functions)
```

Register one line `{ id, name, icon, load }` in `ui/src/apps.js` (icon is a lucide-vue-next component reference).

**Backend** `server/apps/<id>/`, dependencies flow strictly downward:

```text
index.js     → api/index.js → service/index.js → repository/index.js
thin entry      HTTP dispatch    domain + AI tasks    schema/migrations/all SQL
```

Each app gets its own SQLite database (`database/apps/<id>.db`); routes mount under `/apps/<id>/*`; register in `server/apps/registry.js`.

**Docs** `language/<locale>/apps/<id>/APP.md`: frontmatter with name/title/description/backend/database, body listing every endpoint — at runtime the AI relies on it to understand the app, so it must change whenever the API changes.

Full contract in [AGENTS.md](./AGENTS.md).

## AI integration patterns

Apps reach AI only through the system task service — `createTask + waitTask` in the service layer, where all prompts must live. Two proven interaction patterns:

1. **Propose-and-adopt** (content creation): AI output is shown first; nothing is saved until the user adopts it — e.g. notepad's AI continuation.
2. **Smart direct-write** (structured entry): AI outputs JSON → service validates strictly → write to the database — e.g. ledger's one-sentence bookkeeping, todo's inline breakdown.

## Baking philosophy (not i18n)

**Bake once at startup; the result is final.** Both runtime and source are single-language — no key lookup, no runtime dictionary. The text the AI reads and edits in code is the final copy. Language sources live in `language/zh|en/`, kept structurally identical; switch with `AIOS_LANG=en npm run lang:apply`.

## Built-in apps

| App | One line |
|---|---|
| Chat | Talk to AI; also the entry point for creating new apps |
| Tasks | Watch AI task progress, intermediate output, and results |
| Notepad | Notes, with propose-and-adopt AI continuation |
| Todo | Task list with AI inline breakdown |
| Ledger | Income/expense tracking with one-sentence smart entry |
| Settings | Model providers and system configuration |

## Supported models

| Category | Provider |
|---|---|
| Major | OpenAI · Claude · Gemini · Mistral · xAI |
| China | DeepSeek · Kimi · Qwen · GLM · Z.ai · Stepfun · Minimax · Doubao |
| Aggregators | OpenRouter · Together · Fireworks |
| Coding plans | GLM-Coding · Alibaba Bailian · Volcengine Ark · Tencent Hunyuan · JD Cloud · Kimi-Coding |
| Custom | Any OpenAI-compatible endpoint |

Streaming, tool calling, and reasoning content work across providers.

## Ecosystem

| Project | Role |
|---|---|
| **AIOS** (this repo) | Local Node version — the framework itself |
| [AIOS-android](https://github.com/realuckyang/AIOS-android) | Mobile runtime — the same kernel on your phone |
| [wandesk](https://github.com/Sider-ai/wandesk) | Desktop semantic version |
| Cloud version | Cloudflare-native multi-tenant version, in preparation |

## Contributing

The development contract is in [AGENTS.md](./AGENTS.md); commit conventions and contribution records in [dev/contributions](./dev/contributions/). Issues and PRs welcome.

The repo is mirrored on two remotes:

- GitHub: `https://github.com/realuckyang/AIOS.git`
- Gitee: `https://gitee.com/realuckyang/aios.git`

## Community

[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white)](https://discord.gg/YfCbV3m9Q)
[![Issues](https://img.shields.io/badge/Feedback-GitHub%20Issues-181717?logo=github&logoColor=white)](https://github.com/realuckyang/AIOS/issues)

Further reading: [AIOS — an OS for the AI era](https://iimos.ai/blog/aios-open-source-launch) · [Full philosophy](https://iimos.ai/philosophy) · [More posts](https://iimos.ai/blog)

## License

[ISC](./LICENSE) © realuckyang
