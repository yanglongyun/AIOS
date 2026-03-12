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
    name: 'subscriber',
    match: (path) => path.startsWith('/apps/subscriber/'),
    load: () => import('./subscriber/api/index.js'),
    apiHandler: 'handleSubscriberApi',
    dbInit: ['initSubscriberDatabase'],
    serviceStart: ['initSubscriberRuntime']
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
    name: 'reader',
    match: (path) => path.startsWith('/apps/reader/'),
    load: () => import('./reader/api/index.js'),
    apiHandler: 'handleReaderApi',
    dbInit: ['initReaderDatabase']
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
    name: 'banana',
    match: (path) => path.startsWith('/apps/banana/'),
    load: () => import('./banana/api/index.js'),
    apiHandler: 'handleBananaApi',
    dbInit: ['initBananaDatabase']
  },
];
