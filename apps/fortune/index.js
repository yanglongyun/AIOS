import { handleFortuneApi } from './api/index.js';
import { initFortuneDatabase } from './repository/init.js';

export default {
  name: 'fortune',
  match: (path) => path.startsWith('/apps/fortune/'),
  initDb: initFortuneDatabase,
  handleApi: handleFortuneApi
};
