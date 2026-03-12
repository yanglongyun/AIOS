import { handleCryptobotApi } from './api/index.js';
import { initDatabase as initCryptobotDatabase } from './repository/init.js';
import { initRuntime as initCryptobotRuntime } from './runtime/index.js';

export default {
  name: 'cryptobot',
  match: (path) => path.startsWith('/apps/cryptobot/'),
  initDb: initCryptobotDatabase,
  initRuntime: initCryptobotRuntime,
  handleApi: handleCryptobotApi
};
