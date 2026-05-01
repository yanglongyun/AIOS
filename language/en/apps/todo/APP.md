# todo

AIOS's "smart to-do" — every todo can be ticked off by hand, handed off to an agent to actually do, or broken down by AI into smaller sub-tasks.

## Data model

`todos` table in `database/apps/todo.db`:

```
id          INTEGER  auto-increment primary key
parent_id   INTEGER  parent todo id (subtask; null = top-level)
title       TEXT     required, <=500 chars
note        TEXT     optional description (extra context for AI; default '')
done        0 / 1
pinned      0 / 1
task_id     INTEGER  last/current agent task id (points into aios.db.tasks)
task_status TEXT     cached task status: ''/pending/running/done/aborted/error
created_at  TEXT
updated_at  TEXT
```

Subtasks are one level only — a child cannot have grandchildren.

## API

| Method | Path                              | Body                                        | Notes |
|--------|-----------------------------------|---------------------------------------------|-------|
| GET    | `/apps/todo/list`                 | —                                           | Flat array, parents first with children right after |
| POST   | `/apps/todo/create`               | `{ title, parentId?, note? }`               | Pass `parentId` to create a subtask |
| POST   | `/apps/todo/update`               | `{ id, title?, done?, pinned?, note? }`     | Update user-controlled fields |
| POST   | `/apps/todo/delete`               | `{ id }`                                    | Cascades to subtasks |
| POST   | `/apps/todo/run`                  | `{ id }`                                    | Kicks off an agent task; returns immediately, agent runs in background |
| POST   | `/apps/todo/decompose`            | `{ id }`                                    | Instant task that splits the todo into 3-7 subtasks and inserts them |
| POST   | `/apps/todo/update-task-status`   | `{ id, taskStatus }`                        | Frontend writes terminal status back into the cache |

## Integration with agent tasks

- `run` calls `app_shared/agentTask.js#agentTaskStart`, which hits main's `/api/task/create/agent` with `wait=false`. The task row is created and returned immediately; the agent keeps running in the background.
- `decompose` calls `app_shared/instantTask.js#instantTaskJson` against `/api/task/create/instant` with a JSON schema, parses the structured response, and inserts the children directly.
- The frontend polls `/api/task/detail` every ~3s for any todo whose `task_id` is set and `task_status` is not terminal, mirrors the live status into the UI, and writes terminal status back to the cache.
- Every todo-driven task shows up in the `tasks` app and can be traced back via `meta.todoId`.

## Behavior

- When the agent finishes, the todo is **not** auto-marked as done — the user reviews the work log in the drawer and ticks it off.
- A single todo can have at most one in-flight agent task at a time.
- Deleting a parent deletes its subtasks.
- Subtasks cannot be decomposed again (prevents tree explosion).

## Where it lives in AIOS

- Frontend: `gui/src/apps/todo/index.vue`, in the rail's `apps` group
- Backend: `server/apps/todo/` (apps process, port 9502)
- Registration: `server/apps/registry.js` + `gui/src/apps.js` + `gui/src/stores/view.js`
