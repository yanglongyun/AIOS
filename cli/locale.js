const zh = {
  // help
  helpTitle: '\n  AIOS CLI\n',
  helpUsage: '  用法: aios [命令]\n',
  helpCommands: '  命令:',
  helpNone: '交互式 AI 对话',
  helpStart: '启动服务',
  helpStop: '停止服务',
  helpRestart: '重启服务（含前端构建）',
  helpStatus: '查看服务状态',
  helpWeb: '浏览器打开 AIOS',
  helpHelp: '显示帮助信息',

  // service lifecycle
  starting: '启动 AIOS 服务...',
  stopping: '停止 AIOS 服务...',
  stopped: (label) => `已停止: ${label}`,
  notRunning: (label) => `未运行: ${label}`,
  portOccupied: (port, pids) => `警告: 端口 ${port} 仍被占用 -> ${pids}`,
  waitingReady: '等待服务就绪',
  ready: '就绪',
  startTimeout: '服务启动超时',
  alreadyRunning: 'AIOS 服务已在运行',
  startFailed: '启动失败: 服务未就绪',
  started: 'AIOS 服务已启动',
  buildingUI: '构建前端...',
  buildDone: '构建完成',
  buildFailed: '构建失败',
  restartFailed: '重启失败: 服务未就绪',
  restarted: 'AIOS 服务已重启',
  servicesStopped: 'AIOS 服务已停止',
  noServicesFound: '未发现运行中的 AIOS 服务',
  unknownCommand: (cmd) => `未知命令: ${cmd}`,
  runHelp: '运行 aios help 查看可用命令',

  // status
  statusTitle: 'AIOS 服务状态',
  stateNotRunning: '未运行',
  stateRunningNotReady: '运行中(未就绪)',
  stateRunningReady: '运行中(就绪)',

  // auth
  askUsername: 'AIOS 用户名: ',
  askPassword: 'AIOS 密码: ',
  loginFailed: '登录失败',
  noCookie: '登录成功但未获取会话 cookie',

  // chat
  chatWelcome: '输入消息开始对话，Ctrl+C 退出',
  chatStartFailed: (msg) => `启动失败: ${msg}`,
  chatConnectFailed: '连接失败，请确认 AIOS 守护进程正在运行',
  chatDisconnected: '连接断开',
  chatBusy: '（等待上一条回复完成）',
  chatCreateFailed: '创建会话失败',

  // print
  thinking: '思考中...',
};

const en = {
  // help
  helpTitle: '\n  AIOS CLI\n',
  helpUsage: '  Usage: aios [command]\n',
  helpCommands: '  Commands:',
  helpNone: 'Interactive AI chat',
  helpStart: 'Start services',
  helpStop: 'Stop services',
  helpRestart: 'Restart services (with UI build)',
  helpStatus: 'Show service status',
  helpWeb: 'Open AIOS in browser',
  helpHelp: 'Show help',

  // service lifecycle
  starting: 'Starting AIOS services...',
  stopping: 'Stopping AIOS services...',
  stopped: (label) => `Stopped: ${label}`,
  notRunning: (label) => `Not running: ${label}`,
  portOccupied: (port, pids) => `Warning: port ${port} still in use -> ${pids}`,
  waitingReady: 'Waiting for services',
  ready: 'ready',
  startTimeout: 'Service start timed out',
  alreadyRunning: 'AIOS services already running',
  startFailed: 'Start failed: services not ready',
  started: 'AIOS services started',
  buildingUI: 'Building UI...',
  buildDone: 'Build complete',
  buildFailed: 'Build failed',
  restartFailed: 'Restart failed: services not ready',
  restarted: 'AIOS services restarted',
  servicesStopped: 'AIOS services stopped',
  noServicesFound: 'No running AIOS services found',
  unknownCommand: (cmd) => `Unknown command: ${cmd}`,
  runHelp: 'Run aios help to see available commands',

  // status
  statusTitle: 'AIOS Service Status',
  stateNotRunning: 'Not running',
  stateRunningNotReady: 'Running (not ready)',
  stateRunningReady: 'Running (ready)',

  // auth
  askUsername: 'AIOS username: ',
  askPassword: 'AIOS password: ',
  loginFailed: 'Login failed',
  noCookie: 'Login succeeded but no session cookie received',

  // chat
  chatWelcome: 'Type a message to start, Ctrl+C to exit',
  chatStartFailed: (msg) => `Start failed: ${msg}`,
  chatConnectFailed: 'Connection failed, make sure AIOS daemon is running',
  chatDisconnected: 'Disconnected',
  chatBusy: '(Waiting for previous reply)',
  chatCreateFailed: 'Failed to create chat session',

  // print
  thinking: 'Thinking...',
};

const isZh = Intl.DateTimeFormat().resolvedOptions().locale.startsWith('zh');
const t = isZh ? zh : en;

export default t;
