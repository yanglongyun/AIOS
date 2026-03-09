export const appRegistry = [
  {
    name: 'notebook',
    match: (path) => path.startsWith('/apps/notebook/'),
    load: () => import('./notebook/api/index.js'),
    apiHandler: 'handleNotebookApi',
    dbInit: ['initNotebookDatabase']
  },
  {
    name: 'finance',
    match: (path) => path.startsWith('/apps/finance/'),
    load: () => import('./finance/api/index.js'),
    apiHandler: 'handleFinanceApi',
    dbInit: ['initFinanceDatabase']
  },
  {
    name: 'inbox',
    match: (path) => path.startsWith('/apps/inbox/'),
    load: () => import('./inbox/api/index.js'),
    apiHandler: 'handleInboxApi',
    dbInit: ['initInboxDatabase']
  },
  {
    name: 'weibo',
    match: (path) => path.startsWith('/apps/weibo/'),
    load: () => import('./weibo/api/index.js'),
    apiHandler: 'handleWeiboApi',
    dbInit: ['initWeiboDatabase']
  },
  {
    name: 'playground',
    match: (path) => path.startsWith('/apps/playground/'),
    load: () => import('./playground/api/index.js'),
    apiHandler: 'handlePlaygroundApi',
    dbInit: ['initPlaygroundDatabase']
  },
  {
    name: 'briefing',
    match: (path) => path.startsWith('/apps/briefing/'),
    load: () => import('./briefing/api/index.js'),
    apiHandler: 'handleBriefingApi',
    dbInit: ['initBriefingDatabase']
  },
  {
    name: 'cryptobot',
    match: (path) => path.startsWith('/apps/cryptobot/'),
    load: () => import('./cryptobot/api/index.js'),
    apiHandler: 'handleCryptobotApi',
    dbInit: ['initCryptobotDatabase'],
    serviceStart: ['initCryptobotRuntime']
  },
  {
    name: 'story',
    match: (path) => path.startsWith('/apps/story/'),
    load: () => import('./story/api/index.js'),
    apiHandler: 'handleStoryApi',
    dbInit: ['initStoryDatabase']
  },
  {
    name: 'fortune',
    match: (path) => path.startsWith('/apps/fortune/'),
    load: () => import('./fortune/api/index.js'),
    apiHandler: 'handleFortuneApi',
    dbInit: ['initFortuneDatabase']
  },
  {
    name: 'poker',
    match: (path) => path.startsWith('/apps/poker/'),
    load: () => import('./poker/api/index.js'),
    apiHandler: 'handlePokerApi',
    dbInit: ['initPokerDatabase']
  },
  {
    name: 'nokia',
    match: (path) => path.startsWith('/apps/nokia/'),
    load: () => import('./nokia/api/index.js'),
    apiHandler: 'handleNokiaApi',
    dbInit: ['initNokiaDatabase']
  },
];
