# CLAUDE.md

`AGENTS.md` is the project guide for Codex, Claude Code, and similar development collaborators. It is not the runtime system prompt for the AIOS AI. Runtime AI instructions are stored in the database as `settings.systemPrompt` and assembled into model context by `server/main/service/prompt/index.js`.

If you are a dev collaborator, a few orientation points:

- The current working directory **is** the live AIOS runtime workspace — the files you edit are the same files the `9501` (main) and `9502` (apps) Node processes are running
- Backend code edits must be followed by `POST /api/runtime/reload/request` to reload (see the "Reload" section in `AGENTS.md` for parameter semantics); otherwise the new code does not take effect
- These three at the repo root are baked artifacts. **They are not tracked in git, and they don't exist after a fresh `git clone` + `npm i`**. To change the "factory defaults", edit the sources under `language/<locale>/`:
  - `AGENTS.md`           ← `language/<locale>/AGENTS.md`
  - `CLAUDE.md`           ← `language/<locale>/CLAUDE.md` (this file's source)
  - `apps/<name>/APP.md`  ← `language/<locale>/apps/<name>/APP.md`
- Runtime AI instructions should be maintained from Settings -> Instructions; editing `AGENTS.md` does not change the runtime AI prompt
- `database/`, `files/`, `.aios/`, and `.git/` are user state — don't touch them unless explicitly asked

## Auth

AIOS has password auth enabled:

- The first browser visit lands on a "set password" flow; finishing it logs you in
- Subsequent visits require login; the cookie session is sliding 30 days
- AI / curl uses `Authorization: Bearer $AIOS_API_TOKEN` (the token lives in the `auth.api_token` row and is injected into the agent runtime's environment at server startup)
- **Forgot password** — single-user local tool, no recovery flow; reset via SQL:
  ```
  sqlite3 database/aios.db "DELETE FROM auth; DELETE FROM sessions;"
  ```
  On next start the app falls back to first-time setup. The same command is also surfaced in the Settings → Account tab.
