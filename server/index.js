import { httpServer } from './system/http.js';
import { setupWebSocket } from './system/ws.js';
import { initDatabase } from './db/init.js';
import { startScheduler } from './scheduler/index.js';

const PORT = 9700;

initDatabase();
setupWebSocket(httpServer);
startScheduler();

httpServer.listen(PORT, () => {
  console.log('');
  console.log('  AIOS is running');
  console.log('');
  console.log(`  > 本地: http://localhost:${PORT}`);
  console.log('');
});
