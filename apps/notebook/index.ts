import { handleNotebookApi } from './api/index.ts';
import { initNotebookDatabase } from './repository/init.ts';

export default {
  name: 'notebook',
  match: (path) => path.startsWith('/apps/notebook/'),
  initDb: initNotebookDatabase,
  handleApi: handleNotebookApi
};
