# AIOS Agent Working Guide

## 1. Project Overview

AIOS is an AI-native operating environment centered on a resident agent kernel and a set of agent-native applications.

Its core goal is not merely to provide a chat interface, but to let users:

- issue instructions to their machine or server in natural language,
- use AI as a persistent system capability rather than a one-off API call,
- allow applications to dispatch tasks to the underlying AI engine,
- build, operate, and evolve their own software through the same system.

In practical terms, AIOS is closer to an **AI operating environment** than a traditional single-purpose app:

- the **agent** handles reasoning, tool use, task execution, memory, and system-level orchestration;
- the **applications** provide domain surfaces such as chat, tasks, notebook, finance, and other vertical workflows;
- the **system** binds model access, prompt construction, language assets, persistence, and app dispatch into one runtime.

This repository is the **source-of-truth development repository** for AIOS.

## 2. High-Level Architecture

AIOS is organized around a layered architecture. The most important distinction is between the **main system layer** and the **app layer**.

### 2.1 Main system layer

The main system layer lives under `server/main/`. It contains the core runtime that makes AIOS work as a system:

- `server/main/api/`
  HTTP entry points for core system capabilities.
- `server/main/agent/`
  The agent layer: message loop, tool execution, orchestration, task-facing behaviors.
- `server/main/llm/`
  Model access layer: regular completion calls, streaming calls, provider-specific parsing.
- `server/main/prompt/`
  System prompts and prompt assembly logic.
- `server/main/task/`
  Core task creation, execution, stopping, and task-side message persistence.
- `server/main/service/`
  Application-independent business services such as settings and shared system state.
- `server/main/repository/`
  Persistence adapters for SQLite-backed data.
- `server/main/system/`
  Runtime infrastructure such as HTTP serving, language baking, and system wiring.

This layer is where AIOS behaves like an operating environment rather than a single app.

### 2.2 App layer

The app layer is split into frontend surfaces and backend handlers:

- `gui/src/apps/<appname>/`
  Frontend implementation for a specific app.
- `server/apps/<appname>/`
  Backend implementation for regular apps.
- `language/<lang>/apps/<appname>/APP.md`
  The app contract and documentation for that app.

Important exception:

- `chat`, `tasks`, and `settings` are **system-level apps**.
- Their backend logic does **not** live under `server/apps/`.
- They are mounted directly on the main system layer because they are tightly coupled to the agent kernel and system services.

### 2.3 Shared and generated layers

- `server/shared/`
  Shared server-side utilities and cross-cutting modules.
- `language/`
  Language source assets. These are baked into runtime-facing files by `scripts/start.mjs`.
- `.aios/`
  Generated runtime artifacts produced by the language/application preparation flow.
- `database/`
  Local SQLite data and app-specific databases.
- `files/`
  Runtime file outputs such as uploads, exports, and temp artifacts.

## 3. Repository Layout

At a working level, the repository can be read as:

- `server/main/`
  Core AIOS system backend.
- `server/apps/`
  Regular app backends.
- `gui/src/`
  Frontend source.
- `language/`
  Localization and app description sources.
- `scripts/`
  Development and preparation scripts.
- `doc/`
  architecture notes, prompt notes, product essays, and update records.
- `skills/`
  skill definitions and related assets.

If you are making a change, always determine first whether it belongs to:

- the **system kernel**,
- a **system-level app**,
- a **regular app**,
- the **language source**, or
- the **runtime/dev workflow**.

Do not treat all folders as interchangeable.

## 4. Source Repository vs Runtime Repository

This repository has a strict role separation.

- `AIOS/` is the **development source repository**.
- `../AIOS-dev/aios` is the **runtime/dev copy** used for actual execution and validation.

This is not optional workflow preference; it is an architectural constraint of the current toolchain.

### Why this separation exists

`package.json` contains `predev`, `prebuild`, and `prestart` hooks that execute:

```bash
node scripts/start.mjs
```

That preparation step bakes language placeholders and generated assets into the runtime tree. If you run normal npm scripts directly inside `AIOS/`, the source tree itself can be rewritten, producing noisy diffs and mixing generated artifacts with real source edits.

Therefore:

- **edit source only in `AIOS/`;**
- **run the system only from the runtime copy.**

## 5. Standard Development Workflow

The standard workflow is:

1. Edit code in `AIOS/`.
2. From `AIOS/`, run:

```bash
node scripts/dev.mjs
```

3. The script syncs source into `../AIOS-dev/aios`.
4. It then starts the runtime copy there.

### `scripts/dev.mjs`

`AIOS/scripts/dev.mjs` is the approved entry point for development execution.

Supported usage:

- `node scripts/dev.mjs`
  Sync source to runtime copy and start with default locale `zh`.
- `node scripts/dev.mjs en`
  Sync source to runtime copy and start with locale `en`.

Behavior notes:

- it stops the known development ports before restart;
- it syncs source to `../AIOS-dev/aios` using `rsync`;
- it does **not** run `npm install`;
- it does **not** clear database, files, or `.aios` state;
- it assumes the runtime copy already has usable dependencies.

## 6. Non-Negotiable Working Rules for Agents

Any AI agent, automation, or contributor working in this repository must follow these rules:

### 6.1 Editing rules

- Modify source files only in `AIOS/`.
- Do not hand-edit code inside `../AIOS-dev/aios`.
- Treat `../AIOS-dev/aios` as a runtime mirror, not a source repository.

### 6.2 Execution rules

- Do **not** run `npm install`, `npm run dev`, `npm run build`, or `npm start` directly inside `AIOS/`.
- Use `node scripts/dev.mjs` when you need a validated running environment.
- If a task requires runtime verification, perform it in the synced runtime copy, not by turning the source tree into the runtime tree.

### 6.3 Architecture rules

- Before changing an app, read its corresponding `language/<lang>/apps/<appname>/APP.md`.
- Do not place system-level logic in `server/apps/` when it belongs in `server/main/`.
- Do not add prompt logic arbitrarily; keep prompt concerns in `server/main/prompt/`.
- Do not add provider/model parsing logic in random locations; keep model parsing in `server/main/llm/`.

### 6.4 Change classification rules

When deciding whether restart/build is needed, use this model:

- changes under `gui/` usually require frontend rebuild;
- changes under `server/main/` or `server/shared/` usually require main server restart;
- changes under `server/apps/` usually require app-service restart;
- changes under `language/` usually require the preparation/bake pipeline to rerun.

## 7. Recommended Reading Order for New Contributors or Agents

If you are new to the repository, read in this order:

1. `README.md`
   For product positioning and project intent.
2. `doc/update/2026-04-11-结构与语言体系重构.md`
   For repository structure and runtime/source separation.
3. `doc/prompt/INSTRUCTION.md`
   For how AIOS itself models apps, prompts, and architecture constraints.
4. `language/<lang>/apps/<appname>/APP.md`
   For any app you are about to modify.

This order gives you product intent first, then structure, then implementation constraints, then app-level detail.

## 8. Summary

AIOS should be understood as:

- an AI-native operating environment,
- built around an agent kernel,
- extended through agent-native and regular apps,
- backed by a clear separation between source repository and runtime repository.

This repository exists to maintain the **source architecture** cleanly.

The most important operational principle is:

> Develop in `AIOS/`, run in `../AIOS-dev/aios`, and keep generated/runtime behavior out of the source tree.
