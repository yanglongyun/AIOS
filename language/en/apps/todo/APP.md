# todo

iimos's first user-built app — a minimal to-do list.

## Data model

A single `todos` table in `database/apps/todo.db`:

```
id          INTEGER  primary key, auto-increment
title       TEXT     required, <=500 chars
done        0 / 1    completion flag
pinned      0 / 1    pinned flag
created_at  TEXT
updated_at  TEXT
```

## API (mounted on the apps process, reverse-proxied via main)

| Method | Path                    | Body                | Returns |
|--------|-------------------------|---------------------|---------|
| GET    | `/apps/todo/list`       | —                   | `{ items: Todo[] }` |
| POST   | `/apps/todo/create`     | `{ title }`         | `{ item: Todo }` |
| POST   | `/apps/todo/update`     | `{ id, title?, done?, pinned? }` | `{ item: Todo }` |
| POST   | `/apps/todo/delete`     | `{ id }`            | `{ deleted: number }` |

Sort order: `pinned DESC, done ASC, id DESC` — pinned first, unfinished first, newest first.

## Where it lives in iimos

- Backend: `server/apps/todo/` (apps process, port 9502)
- Frontend: `gui/src/apps/todo/index.vue`, registered in the rail nav
- Registration: `server/apps/registry.js` + `gui/src/apps.js` + `gui/src/stores/view.js`

## Future extensions

The first cut is just CRUD. Add as needed: due dates, tags, subtasks, reminders, grouping by date, integration with tasks (let AI run a long-running session for a todo item).
