import { handlePokerApi } from './api/index.ts';
import { initPokerDatabase } from './repository/init.ts';

export default {
  name: 'poker',
  match: (path) => path.startsWith('/apps/poker/'),
  initDb: initPokerDatabase,
  handleApi: handlePokerApi
};
