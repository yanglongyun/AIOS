import { handleFilesApi } from './api/index.js';

export default {
  name: 'files',
  match: (path) => path.startsWith('/api/files/'),
  handleApi: handleFilesApi
};
