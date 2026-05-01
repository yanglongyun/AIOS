# notebook

Local notebook app for lightweight text notes.

## Data Model

The `notes` table in `database/apps/notebook.db`:

```
id          INTEGER  auto-increment primary key
title       TEXT     title
content     TEXT     body
pinned      0 / 1    pinned flag
created_at  TEXT     created time
updated_at  TEXT     updated time
```

## API

| Method | Path | Body |
|--------|------|------|
| GET | `/apps/notebook/list` | - |
| POST | `/apps/notebook/create` | `{ title, content? }` |
| POST | `/apps/notebook/update` | `{ id, title?, content?, pinned? }` |
| POST | `/apps/notebook/delete` | `{ id }` |
