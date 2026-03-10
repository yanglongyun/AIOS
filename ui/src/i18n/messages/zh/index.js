import common from './common.js';
import framework from './framework.js';
import chat from './views/chat.js';
import history from './views/history.js';
import login from './views/login.js';
import taskdetail from './views/taskdetail.js';
import subscriber from './views/apps/subscriber.js';
import createapp from './views/apps/createapp.js';
import cryptobot from './views/apps/cryptobot.js';
import finance from './views/apps/finance.js';
import fortune from './views/apps/fortune.js';
import nokia from './views/apps/nokia.js';
import notebook from './views/apps/notebook.js';
import poker from './views/apps/poker.js';
import reader from './views/apps/reader.js';
import settings from './views/settings.js';
import welcome from './views/welcome.js';

export default {
  ...common,
  ...framework,
  ...chat,
  ...history,
  ...login,
  ...taskdetail,
  ...subscriber,
  ...createapp,
  ...cryptobot,
  ...finance,
  ...fortune,
  ...nokia,
  ...notebook,
  ...poker,
  ...reader,
  ...settings,
  ...welcome
};
