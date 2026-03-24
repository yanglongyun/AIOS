import { handleReaderApi } from './api/index.ts';
import { initReaderDatabase } from './repository/init.ts';

export default {
  name: 'reader',
  match: (path) => path.startsWith('/apps/reader/'),
  initDb: initReaderDatabase,
  handleApi: handleReaderApi
};
