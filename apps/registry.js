export const appRegistry = [
  {
    name: 'notebook',
    match: (path) => path.startsWith('/apps/notebook/'),
    load: () => import('./notebook/index.js'),
    apiHandler: 'handleNotebookApi',
    dbInit: ['initNotebookDatabase']
  },
  {
    name: 'finance',
    match: (path) => path.startsWith('/apps/finance/'),
    load: () => import('./finance/index.js'),
    apiHandler: 'handleFinanceApi',
    dbInit: ['initFinanceDatabase']
  },
  {
    name: 'inbox',
    match: (path) => path.startsWith('/apps/inbox/'),
    load: () => import('./inbox/index.js'),
    apiHandler: 'handleInboxApi',
    dbInit: ['initInboxDatabase']
  },
  {
    name: 'playground',
    match: (path) => path.startsWith('/apps/playground/'),
    load: () => import('./playground/index.js'),
    apiHandler: 'handlePlaygroundApi',
    dbInit: ['initPlaygroundDatabase']
  },
  {
    name: 'nokia',
    match: (path) => path.startsWith('/apps/nokia/'),
    load: () => import('./nokia/index.js'),
    apiHandler: 'handleNokiaApi',
    dbInit: ['initNokiaDatabase']
  },
  {
    name: 'debate',
    match: (path) => path.startsWith('/apps/debate/'),
    load: () => import('./debate/index.js'),
    apiHandler: 'handleDebateApi',
    dbInit: ['initDebateDatabase']
  },
  {
    name: 'treasure',
    match: (path) => path.startsWith('/apps/treasure/'),
    load: () => import('./treasure/index.js'),
    apiHandler: 'handleTreasureApi',
    dbInit: ['initTreasureDatabase']
  },
  {
    name: 'briefing',
    match: (path) => path.startsWith('/apps/briefing/'),
    load: () => import('./briefing/index.js'),
    apiHandler: 'handleBriefingApi',
    dbInit: ['initBriefingDatabase']
  },
  {
    name: 'dailycheck',
    match: (path) => path.startsWith('/apps/dailycheck/'),
    load: () => import('./dailycheck/index.js'),
    apiHandler: 'handleDailycheckApi',
    dbInit: ['initDailycheckDatabase']
  },
  {
    name: 'cryptobot',
    match: (path) => path.startsWith('/apps/cryptobot/'),
    load: () => import('./cryptobot/index.js'),
    apiHandler: 'handleCryptobotApi',
    dbInit: ['initCryptobotDatabase'],
    serviceStart: ['initCryptobotRuntime']
  },
  {
    name: 'story',
    match: (path) => path.startsWith('/apps/story/'),
    load: () => import('./story/index.js'),
    apiHandler: 'handleStoryApi',
    dbInit: ['initStoryDatabase']
  },
  {
    name: 'blackroom',
    match: (path) => path.startsWith('/apps/blackroom/'),
    load: () => import('./blackroom/index.js'),
    apiHandler: 'handleBlackroomApi',
    dbInit: ['initBlackroomDatabase']
  },
  {
    name: 'fortune',
    match: (path) => path.startsWith('/apps/fortune/'),
    load: () => import('./fortune/index.js'),
    apiHandler: 'handleFortuneApi',
    dbInit: ['initFortuneDatabase']
  },
  {
    name: 'poker',
    match: (path) => path.startsWith('/apps/poker/'),
    load: () => import('./poker/index.js'),
    apiHandler: 'handlePokerApi',
    dbInit: ['initPokerDatabase']
  },
  {
    name: 'doodle',
    match: (path) => path.startsWith('/apps/doodle/'),
    load: () => import('./doodle/index.js'),
    apiHandler: 'handleDoodleApi',
    dbInit: ['initDoodleDatabase']
  },
  {
    name: 'redmill',
    match: (path) => path.startsWith('/apps/redmill/'),
    load: () => import('./redmill/index.js'),
    apiHandler: 'handleRedmillApi',
    dbInit: ['initRedmillDatabase']
  }
];
