import { handleCreateAppApi } from './api/index.js';
import { initCreateAppDatabase } from './repository/init.js';

export default {
  name: 'createapp',
  match: (path) => path.startsWith('/apps/createapp/'),
  initDb: initCreateAppDatabase,
  handleApi: handleCreateAppApi
};
