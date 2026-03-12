import { handleSubscriberApi } from './api/index.js';
import { initSubscriberDatabase } from './repository/init.js';
import { initRuntime as initSubscriberRuntime } from './runtime/index.js';

export default {
  name: 'subscriber',
  match: (path) => path.startsWith('/apps/subscriber/'),
  initDb: initSubscriberDatabase,
  initRuntime: initSubscriberRuntime,
  handleApi: handleSubscriberApi
};
