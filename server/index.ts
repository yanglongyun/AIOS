import { httpServer } from './system/http.ts';
import { setupWebSocket } from './system/ws.ts';
import { initSystemDirs } from './system/dir.ts';
import { initDatabase } from './repository/init.ts';
import { startTaskScheduler } from './task/schedule/scheduler.ts';
const PORT = 9700;

initSystemDirs();
initDatabase();
setupWebSocket(httpServer);
startTaskScheduler();

httpServer.listen(PORT, () => {
  console.log('');
  console.log('  AIOS is running');
  console.log('');
  console.log(`  > 本地: http://localhost:${PORT}`);
  console.log('');
});
