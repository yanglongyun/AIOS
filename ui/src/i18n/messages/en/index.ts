import common from './common.ts';
import framework from './framework.ts';
import chat from './views/chat.ts';
import login from './views/login.ts';
import taskdetail from './views/taskdetail.ts';
import subscriber from './views/apps/subscriber.ts';
import createapp from './views/apps/createapp.ts';
import cryptobot from './views/apps/cryptobot.ts';
import finance from './views/apps/finance.ts';
import fortune from './views/apps/fortune.ts';
import banana from './views/apps/banana.ts';
import notebook from './views/apps/notebook.ts';
import poker from './views/apps/poker.ts';
import reader from './views/apps/reader.ts';
import openclaw from './views/apps/openclaw.ts';
import settings from './views/settings.ts';
import welcome from './views/welcome.ts';

export default {
  ...common,
  ...framework,
  ...chat,
  ...login,
  ...taskdetail,
  ...subscriber,
  ...createapp,
  ...cryptobot,
  ...finance,
  ...fortune,
  ...banana,
  ...notebook,
  ...poker,
  ...reader,
  ...openclaw,
  ...settings,
  ...welcome
};
