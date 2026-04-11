---
name: createapp
description: 🚀 应用创建器 - 通过对话描述需求，AI 帮助构建应用
backend: server/apps/createapp
database: database/apps/createapp.db
---

## 重载约定

- 当 AI 修改了代码后，不要直接调用 `/api/system/reload`。
- 正常流程是调用 `/api/system/reload/request`，系统会先做后台预检。
- 预检通过后，前端才会弹出最终确认框；用户确认后才会执行真正切换。
- 预检失败时，会直接返回错误，不会影响当前正在运行的服务。

推荐参数：

```bash
curl -X POST http://localhost:9500/api/system/reload/request \
  -H "Content-Type: application/json" \
  -d '{"build": false, "restartApps": true, "restartServer": false, "message": "应用后端更新"}'
```

如果只是想验证能否启动，而不想弹窗或切换当前服务，可以调用：

```bash
curl -X POST http://localhost:9500/api/system/reload/test \
  -H "Content-Type: application/json" \
  -d '{"build": false, "restartApps": true, "restartServer": false}'
```
