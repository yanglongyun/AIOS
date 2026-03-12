import { handleBananaApi } from './api/index.js';
import { initBananaDatabase } from './repository/init.js';

export default {
  name: 'banana',
  match: (path) => path.startsWith('/apps/banana/'),
  initDb: initBananaDatabase,
  handleApi: handleBananaApi
};
