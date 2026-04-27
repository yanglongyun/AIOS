# CLAUDE.md

`AIOS/AGENTS.md` is the **runtime system prompt for the AIOS agent**. It is injected into the model context by `server/main/prompt/index.js`. It is **not** the engineering collaboration guide for repository contributors, so do not treat it as the source repo's development convention.

If you are a development collaborator, including Claude Code or Codex, read the workspace-level collaboration guide instead:

- `../AGENTS.md` - Wandesk Workspace guide, covering cross-project release flow, packaging, and source/workspace boundaries.

If the current directory is the root of a Wandesk-installed `workspace`, this directory is the AIOS working copy actually running on the user's machine. Modify it according to the user's task, but do not damage user state such as `database/`, `files/`, `.aios/`, or `.git/` unless the user explicitly asks for cleanup or reset.
