import { httpServer } from './system/http.js';
import { setupWebSocket } from './system/ws.js';
import { initDatabase } from './db/init.js';
const PORT = 9700;

initDatabase();
setupWebSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log('');
  console.log('  AIOS is running');
  console.log('');
  console.log(`  > 本地: http://localhost:${PORT}`);
  console.log('');
});
