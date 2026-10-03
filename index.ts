import { startServer } from "./server/index.js";
import { stopAllApps } from "./server/apps/supervisor.js";

const port = Number(process.env.AIOS_PORT) || 80;
process.env.AIOS_PORT = String(port);
await startServer(port, process.env.AIOS_HOST || "0.0.0.0");

// 退出时收尾:app 子进程是我们 spawn 的,不收会留下一地孤儿进程还占着端口。
let closing = false;
const shutdown = async () => {
  if (closing) return;
  closing = true;
  await stopAllApps().catch(() => { /* 尽力而为,别拖着不退 */ });
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
