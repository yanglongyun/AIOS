import { handleFilesApi } from './api/index.ts';

export default {
  name: 'files',
  match: (path) => path.startsWith('/api/files/'),
  handleApi: handleFilesApi
};
