import { handleCryptobotApi } from './api/index.ts';
import { initDatabase as initCryptobotDatabase } from './repository/init.ts';
import { initRuntime as initCryptobotRuntime } from './runtime/index.ts';

export default {
  name: 'cryptobot',
  match: (path) => path.startsWith('/apps/cryptobot/'),
  initDb: initCryptobotDatabase,
  initRuntime: initCryptobotRuntime,
  handleApi: handleCryptobotApi
};
