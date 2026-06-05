# create-app

## Description
在本系统(AIOS)里新建一个应用。当用户要求"做一个 X 应用 / 创建一个 app / 帮我搭个小工具"时使用。应用不是用流水线生成的——你直接用 shell 按下面的固定结构写文件、改两个注册表即可。严格遵循本系统的目录约定与文件契约。

## 什么是一个 app

一个 app = 5 个部分,缺一不可:

1. **后端**:`server/apps/<id>/index.ts` —— 自带后端 + 独立 SQLite 库
2. **后端注册**:在 `server/apps/registry.ts` 加一行 loader
3. **前端**:`ui/src/apps/<id>/index.tsx` —— 一个 React 组件(默认导出)
4. **前端注册**:在 `ui/src/apps/registry.ts` 的 `apps` 数组加一项;若用新图标,在 `ui/src/system/components/MainNav.tsx` 的 `appIconMap` 加一条
5. **说明书**:`apps/<id>/APP.md`

约定:`<id>` 用小写英文(如 `habit`);ESM,导入路径写 `.js` 后缀;服务端文件首行 `// @ts-nocheck`;每个 app **只能**碰自己的 `/apps/<id>/*` 路由和自己的库,不准动别的 app 或主服务。

## 后端模板 `server/apps/<id>/index.ts`

```ts
// @ts-nocheck
import { createAppDb } from "../_shared/db.js";
import { readBody, sendJson, parseJson } from "../_shared/http.js";

let db;
const initDb = () => {
  if (db) return db;
  db = createAppDb("<id>.db");           // 独立库 database/apps/<id>.db
  db.exec(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
  return db;
};

const match = (path) => path.startsWith("/apps/<id>/");

const handleApi = async (req, res, path, url) => {
  initDb();
  if (path !== "/apps/<id>/items") return false;   // 路由分发
  const id = url.searchParams.get("id");
  if (req.method === "GET") {
    sendJson(res, 200, { ok: true, items: db.prepare("SELECT * FROM items ORDER BY id DESC").all() });
    return true;
  }
  if (req.method === "POST") {
    const body = parseJson(await readBody(req));
    const row = db.prepare("INSERT INTO items (text) VALUES (?) RETURNING *").get(String(body.text || ""));
    sendJson(res, 201, { ok: true, item: row });
    return true;
  }
  if (req.method === "DELETE") {
    if (!id) return sendJson(res, 400, { ok: false, error: "id is required" });
    db.prepare("DELETE FROM items WHERE id = ?").run(Number(id));
    sendJson(res, 200, { ok: true });
    return true;
  }
  return false;
};

export default { name: "<id>", match, handleApi, initDb };
```

后端注册——编辑 `server/apps/registry.ts`,往 `appLoaders` 数组加一行:
```ts
() => import("./<id>/index.js"),
```

## 前端模板 `ui/src/apps/<id>/index.tsx`

```tsx
import { useEffect, useState } from "react";
import { appFetch } from "../lib";          // 共用 fetch,自动指向 /apps/...

export default function Xapp() {
  const [items, setItems] = useState<any[]>([]);
  const refresh = () => appFetch<{ items: any[] }>("/apps/<id>/items").then((d) => setItems(d.items));
  useEffect(() => { refresh(); }, []);
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-5 py-8 flex flex-col gap-4">
        <h2 className="m-0 text-2xl font-semibold text-text">X</h2>
        {/* 用现有样式类:btn / btn-sm / btn-primary / input / textarea / field / field-label / badge / empty / inline-error */}
      </div>
    </div>
  );
}
```

前端注册——编辑 `ui/src/apps/registry.ts`,往 `apps` 数组加一项:
```ts
{ id: "<id>", name: "中文名", icon: "<id>", color: "#60a5fa", load: () => import("./<id>") },
```
图标——编辑 `ui/src/system/components/MainNav.tsx` 的 `appIconMap`,从 `lucide-react` 选一个图标加一条 `<id>: SomeIcon`(并在文件顶部 import 它)。没加则自动用 Bot 兜底。

## 说明书 `apps/<id>/APP.md`

```md
---
name: <id>
description: 一句话说明这个 app 做什么。
backend: server/apps/<id>
frontend: ui/src/apps/<id>
database: database/apps/<id>.db
---

# <id> 中文名

数据模型、API 列表写清楚(参考 apps/notepad/APP.md)。
```

## 流程与验证

1. 起一个简短小写 `<id>`。
2. 按上面 5 部分写文件 + 改两个 registry(+ 图标)。
3. 验证后端:`npx tsc --noEmit`;验证前端:`npm run ui:build`。
4. **生效**:前端经 Vite HMR 立即出现在侧边栏「应用」里;**后端是启动时加载的,新增 app 需要重启一次服务**(让用户重跑 `npm run ui`,或重启进程)才能让 `/apps/<id>/*` 生效。
5. 可参考三个现成样板:`server/apps/{notepad,todo,ledger}` 与 `ui/src/apps/{notepad,todo,ledger}`,照着抄最稳。

完成后,简要告诉用户:建了哪个 app、文件清单、以及"重启服务后即可在侧边栏使用"。
