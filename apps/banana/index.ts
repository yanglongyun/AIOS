import { handleBananaApi } from './api/index.ts';
import { initBananaDatabase } from './repository/init.ts';

export default {
  name: 'banana',
  match: (path) => path.startsWith('/apps/banana/'),
  initDb: initBananaDatabase,
  handleApi: handleBananaApi
};
