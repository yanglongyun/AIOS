import { handleFinanceApi } from './api/index.ts';
import { initFinanceDatabase } from './repository/init.ts';

export default {
  name: 'finance',
  match: (path) => path.startsWith('/apps/finance/'),
  initDb: initFinanceDatabase,
  handleApi: handleFinanceApi
};
