import common from './common.js';
import framework from './framework.js';
import chat from './views/chat.js';
import notebook from './views/apps/notebook.js';
import finance from './views/apps/finance.js';
import blackroom from './views/apps/blackroom.js';
import cryptobot from './views/apps/cryptobot.js';
import fortune from './views/apps/fortune.js';
import inbox from './views/apps/inbox.js';
import beach from './views/apps/beach.js';
import nokia from './views/apps/nokia.js';
import playground from './views/apps/playground.js';
import story from './views/apps/story.js';
import treasure from './views/apps/treasure.js';
import weibo from './views/apps/weibo.js';
import poker from './views/apps/poker.js';
import history from './views/history.js';
import settings from './views/settings.js';
import welcome from './views/welcome.js';

export default {
  ...common,
  ...framework,
  ...chat,
  ...history,
  ...notebook,
  ...blackroom,
  ...cryptobot,
  ...finance,
  ...fortune,
  ...inbox,
  ...beach,
  ...nokia,
  ...playground,
  ...story,
  ...treasure,
  ...weibo,
  ...poker,
  ...settings,
  ...welcome
};
