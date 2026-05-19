<div align="center">

# AIOS

**The Operating System for the AI Era**

Build native apps tailored to your needs through dialogue. A unified AI kernel that lets your apps talk to AI, too.

[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.5-43853d.svg)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey.svg)](#-install)
[![Discord](https://img.shields.io/discord/0?label=Discord&logo=discord&color=5865F2)](https://discord.gg/YfCbV3m9Q)
[![Stars](https://img.shields.io/github/stars/realuckyang/AIOS?style=social)](https://github.com/realuckyang/AIOS)

[简体中文](./README.md) · **English**

<img src="https://iimos.ai/blog/iimos-screenshots/images/readme-overview.webp" alt="AIOS Screenshot" width="100%" />

</div>

---

## ✨ What is it

AIOS is a **fully local-first** AI workstation:

- 🗣 **Conversation as command** — drive your computer in natural language
- 🧩 **23 built-in apps** — notes, ledger, terminal, files, Claude Code, RSS, earth, debate, and more
- 🤖 **Agent task system** — apps can dispatch Tasks to the system; AI orchestrates context and tools
- 🏠 **Your data is yours** — all chats, notes, and configuration stay in local SQLite
- 🔌 **23+ model providers** — OpenAI / Claude / Gemini / DeepSeek / Kimi / Qwen / GLM …
- 🎨 **Building apps is a native capability** — AIOS's AI carries a full shell, can write code, start services, debug, and ship apps to you. No "workshop" needed — that's just what it does.
- 🌐 **AI-friendly i18n** — write natural language directly in source; build-time baking handles translation, so AI-generated apps don't carry i18n boilerplate

> Not just another LLM frontend — AIOS's AI carries a full shell and system-level tools. It can drive apps, and write apps for you.

---

## 📑 Table of Contents

- [Install](#-install)
- [First Run](#-first-run)
- [Supported Models](#-supported-models)
- [Built-in Apps](#-built-in-apps)
- [Architecture](#-architecture)
- [Design Philosophy](#-design-philosophy)
- [Development & Contributing](#-development--contributing)
- [FAQ](#-faq)
- [License](#-license)

---

## 🚀 Install

### Requirements

| Item | Required |
|---|---|
| OS | macOS 12+ / mainstream Linux / Windows 10 1809+ |
| Node.js | 22.5 or newer (the script auto-installs it) |
| Ports | `9502` (main), `9503` (apps), `5173` (Vite dev) |
| Disk | ≥ 1 GB |

### One-line Install

> ⚠️ The installer uses your package manager to install Node, git, rsync, then clones and builds AIOS. Read the [script](https://github.com/realuckyang/AIOS/blob/main/install-macos.sh) before running.

**macOS** (auto-installs Homebrew + Node@22)
```bash
curl -fsSL https://raw.githubusercontent.com/realuckyang/AIOS/main/install-macos.sh | sh
```

**Linux** (apt / dnf / yum / apk / pacman + NodeSource)
```bash
curl -fsSL https://raw.githubusercontent.com/realuckyang/AIOS/main/install-linux.sh | sh
```

**Windows** (requires winget; bundled with Win10 1809+ / Win11)
```powershell
powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/realuckyang/AIOS/main/install-windows.ps1 | iex"
```

### Manual Install

```bash
git clone https://github.com/realuckyang/AIOS.git
cd AIOS
npm install
npm run build
npm run start:main &
npm run start:apps
```

### Uninstall

The default install directory is `~/.aios`. Just delete it:
```bash
rm -rf ~/.aios
```

---

## 🎬 First Run

1. Open `http://localhost:9502`
2. Set an access password (used only on this machine)
3. Go to **Settings → Model**, fill in an API key for any provider
4. Back in **Chat**, just say "build me an app that does X" — the AI will write code, start services, and hand the app over to you through its shell

---

## 🧠 Supported Models

| Group | Providers |
|---|---|
| Mainstream | OpenAI · Claude · Gemini · Mistral · xAI |
| China | DeepSeek · Kimi · Qwen · GLM · Z.ai · Stepfun · Minimax · Doubao |
| Aggregators | OpenRouter · Together · Fireworks |
| Coding Plans | GLM-Coding · Aliyun Bailian · Volcano Ark · Tencent Hunyuan · JD Cloud · Kimi-Coding |
| Custom | Any OpenAI-compatible endpoint |

Streaming, tool calling, and reasoning content are all supported.

---

## 📦 Built-in Apps

| Group | Apps |
|---|---|
| System | Chat · Tasks · Settings |
| Work | Notebook · Ledger · Files · Terminal · Claude Code · System Status |
| Information | Subbox · GitHub Trending · Hacker News · RSS Reader |
| Experiments | Old Phone · Fortune · Companion · Poker · Treasure · Debate · Earth · Civilization · CryptoBot · Memory |

Apps can dispatch Tasks back to the system, letting AI take over complex flows instead of being stuck behind one-off API calls.

---

## 🏗 Architecture

```text
AIOS/
├── server/
│   ├── main/        # Main service :9502  HTTP / WS / Auth / Chat / Task / LLM
│   │   ├── api/     # Route entry
│   │   ├── ai/      # Agent loop + tool calling
│   │   ├── llm/     # Provider / Input / Requester / Output pipelines
│   │   ├── service/ # Auth / Chat / Task / Prompt / Runtime / Settings
│   │   └── repository/  # SQLite access
│   └── apps/        # Apps service :9503  each app brings its own backend
├── gui/             # Vue 3 frontend (Vite, Pinia, Tailwind v4)
├── apps/            # Per-app APP.md and shared assets
├── language/        # Localization sources
└── scripts/         # Start / build / fix scripts
```

**Stack**: Node.js 22.5+ · Vue 3 · Vite 7 · node:sqlite · Tailwind v4 · ws · node-pty · xterm.js

Storage: a single local SQLite file (`database/aios.db`), fully backup-able and portable.

---

## 💡 Design Philosophy

> **The future will not dissolve into formlessness; it will remain in concrete form.**

AIOS believes four things:

1. **Conversation** is the new paradigm of human-computer interaction — simple, efficient, with built-in context.
2. **Interfaces** remain indispensable — form is function. A chat window can't hold a calendar, a ledger, or a reader.
3. **Everyone deserves their own software** — when AI writes the code, software no longer belongs to developers; it belongs to the people who use it.
4. **AI and apps call each other** — apps are not just AI's display layer. They can also dispatch tasks back to the underlying AI, letting the system take over complex logic.

Full version: [Read on iimos.ai →](https://iimos.ai/philosophy) (Chinese)

More AIOS product writing on iimos.ai:

- [AIOS — The Operating System for the AI Era](https://iimos.ai/blog/aios-open-source-launch)
- [Agent OS kernel + Agent-native Apps = AIOS](https://iimos.ai/blog/agent-os-kernel-and-apps)
- [Everything Is a Command](https://iimos.ai/blog/everything-is-a-command)
- [AIOS — I Vibe-Coded an AI Operating System](https://iimos.ai/blog/vibe-coding-aios)
- [More articles →](https://iimos.ai/blog)

---

## 🛠 Development & Contributing

```bash
# Dev mode (main + apps + Vite dev)
npm run dev

# Backend only
npm run start:main &
npm run start:apps

# Reset language baking cache
npm run lang:reset
```

Issues and PRs welcome. Please read [CONTRIBUTING.md](./dev/contributions/CONTRIBUTING.md) (WIP) before submitting.

---

## ❓ FAQ

**Q: Ports 9502 / 9503 are taken — how do I change them?**
Set environment variables: `AIOS_SERVER_PORT=9601 AIOS_APPS_PORT=9602 ...`.

**Q: I forgot the access password.**
Delete the `auth` row in `database/aios.db`, or reset the whole DB and go through onboarding again.

**Q: Where is my data stored?**
Default `~/.aios/app/database/aios.db` (one-line install) or `database/` in the cloned repo (manual install).

**Q: `node-pty` build fails.**
The script tries to fix it (`scripts/fix-node-pty.js`). If it still fails, make sure you have a C++ toolchain installed.

**Q: Why "language baking" instead of runtime i18n?**
AIOS's core scenario is AI-authored apps. Runtime i18n forces AI to wrap every string in `t()`, maintain N translation JSONs, name keys, and avoid omissions — a compounding cognitive tax. Baking lets source code use natural language, then replaces it once at build time. Cost: re-run `scripts/start.mjs` when switching languages (cached runs hit < 10ms).

**Q: How is AIOS different from Open WebUI / LibreChat / LobeChat?**
Those are mainly LLM chat frontends. AIOS is a **local operating system** with AI-native apps and an agent task system — Chat is just one entry point.

---

## 📄 License

[ISC](./LICENSE) © realuckyang

---

## 💬 Community

[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white)](https://discord.gg/YfCbV3m9Q)

Ideas, bugs, AI-native app showcases — come hang out.
