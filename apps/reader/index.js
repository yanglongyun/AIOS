import { handleReaderApi } from './api/index.js';
import { initReaderDatabase } from './repository/init.js';

export default {
  name: 'reader',
  match: (path) => path.startsWith('/apps/reader/'),
  initDb: initReaderDatabase,
  handleApi: handleReaderApi
};
