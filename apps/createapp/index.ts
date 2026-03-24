import { handleCreateAppApi } from './api/index.ts';
import { initCreateAppDatabase } from './repository/init.ts';

export default {
  name: 'createapp',
  match: (path) => path.startsWith('/apps/createapp/'),
  initDb: initCreateAppDatabase,
  handleApi: handleCreateAppApi
};
