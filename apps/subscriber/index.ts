import { handleSubscriberApi } from './api/index.ts';
import { initSubscriberDatabase } from './repository/init.ts';
import { initRuntime as initSubscriberRuntime } from './runtime/index.ts';

export default {
  name: 'subscriber',
  match: (path) => path.startsWith('/apps/subscriber/'),
  initDb: initSubscriberDatabase,
  initRuntime: initSubscriberRuntime,
  handleApi: handleSubscriberApi
};
