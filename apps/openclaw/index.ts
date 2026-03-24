import { handleOpenclawApi } from './api/index.ts';

export default {
  name: 'openclaw',
  match: (path) => path.startsWith('/apps/openclaw/'),
  handleApi: handleOpenclawApi
};
