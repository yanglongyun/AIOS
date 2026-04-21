import { httpServer } from "./system/http.js";
import { setupWebSocket } from "./system/ws.js";
import { initSystemDirs } from "./system/dir.js";
import { initDatabase } from "./repository/init.js";
const portArg = process.argv.find((arg) => arg.startsWith("--port="));
if (portArg && !/^\-\-port=\d+$/.test(portArg)) {
  throw new Error("Invalid port argument");
}
const DEFAULT_SERVER_PORT = Number(process.env.AIOS_SERVER_PORT || 9501);
const PORT = portArg ? Number(portArg.slice("--port=".length)) : DEFAULT_SERVER_PORT;
initSystemDirs();
initDatabase();
setupWebSocket(httpServer);
httpServer.listen(PORT, () => {
  console.log("");
  console.log("  AIOS is running");
  console.log("");
  console.log(`  > 本地: http://localhost:${PORT}`);
  console.log("");
});
