import common from './common.js';
import framework from './framework.js';
import chat from './views/chat.js';
import notebook from './views/apps/notebook.js';
import settings from './views/settings.js';
import welcome from './views/welcome.js';

export default {
  ...common,
  ...framework,
  ...chat,
  ...notebook,
  ...settings,
  ...welcome
};
