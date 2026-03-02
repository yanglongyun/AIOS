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
    match: (path) => path.startsWith('/apps/inbox/') || path === '/inbox/submit',
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
    name: 'mindtree',
    match: (path) => path.startsWith('/apps/mindtree/'),
    load: () => import('./mindtree/index.js'),
    apiHandler: 'handleMindtreeApi',
    dbInit: ['initMindtreeDatabase']
  },
  {
    name: 'writerpad',
    match: (path) => path.startsWith('/apps/writerpad/'),
    load: () => import('./writerpad/index.js'),
    apiHandler: 'handleWriterpadApi',
    dbInit: ['initWriterpadDatabase']
  },
  {
    name: 'lovehouse',
    match: (path) => path.startsWith('/apps/lovehouse/'),
    load: () => import('./lovehouse/index.js'),
    apiHandler: 'handleLovehouseApi',
    dbInit: ['initLovehouseDatabase']
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
  }
];

