import { handlePokerApi } from './api/index.js';
import { initPokerDatabase } from './repository/init.js';

export default {
  name: 'poker',
  match: (path) => path.startsWith('/apps/poker/'),
  initDb: initPokerDatabase,
  handleApi: handlePokerApi
};
