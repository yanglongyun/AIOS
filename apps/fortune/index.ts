import { handleFortuneApi } from './api/index.ts';
import { initFortuneDatabase } from './repository/init.ts';

export default {
  name: 'fortune',
  match: (path) => path.startsWith('/apps/fortune/'),
  initDb: initFortuneDatabase,
  handleApi: handleFortuneApi
};
