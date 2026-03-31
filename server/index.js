import { httpServer } from "./system/http.js";
import { setupWebSocket } from "./system/ws.js";
import { initSystemDirs } from "./system/dir.js";
import { initDatabase } from "./repository/init.js";
import { startTaskScheduler } from "./task/schedule/scheduler.js";
const portArg = process.argv.find((arg) => arg.startsWith("--port="));
if (portArg && !/^\-\-port=\d+$/.test(portArg)) {
  throw new Error("端口参数不合法");
}
const PORT = portArg ? Number(portArg.slice("--port=".length)) : 9700;
initSystemDirs();
initDatabase();
setupWebSocket(httpServer);
startTaskScheduler();
httpServer.listen(PORT, () => {
  console.log("");
  console.log("  AIOS is running");
  console.log("");
  console.log(`  > 本地: http://localhost:${PORT}`);
  console.log("");
});
