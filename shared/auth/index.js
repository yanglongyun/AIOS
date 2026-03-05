import { countUsers } from './repository.js';
import { getAuthUser } from './guard.js';
import { isLocalCliBypass } from './network.js';

const allowServerPublic = (req, path, method) => {
  if (isLocalCliBypass(req, path, method)) return true;
  return path === '/api/health' || path.startsWith('/api/auth/') || path.startsWith('/api/setup/');
};

const allowServerDuringSetup = (path, method) => {
  return (path === '/api/settings' && (method === 'GET' || method === 'POST'))
    || (path === '/api/task/create/instant' && method === 'POST')
    || (path === '/api/task/create/agent' && method === 'POST');
};

const allowAppsPublic = (path) => {
  return path === '/apps/health'
    || path === '/apps/inbox/submit'
    || path === '/apps/weibo/feed'
    || path === '/apps/weibo/list'
    || path.startsWith('/public/');
};

// 唯一对外入口：调用方只需要 access(...) 即可完成鉴权/初始化门禁。
export const access = (req, path, method, scope) => {
  const initialized = countUsers() > 0;

  if (scope === 'server-api') {
    if (allowServerPublic(req, path, method)) {
      return { ok: true, initialized, user: null };
    }
    if (!initialized && !allowServerDuringSetup(path, method)) {
      return { ok: false, status: 423, message: '系统未初始化，请先完成欢迎安装流程' };
    }
    if (!initialized && allowServerDuringSetup(path, method)) {
      return { ok: true, initialized, user: null };
    }
    const user = getAuthUser(req);
    if (!user) return { ok: false, status: 401, message: '未登录' };
    return { ok: true, initialized, user };
  }

  if (scope === 'apps') {
    if (allowAppsPublic(path)) return { ok: true, initialized, user: null };
    if (!initialized) {
      return { ok: false, status: 423, message: '系统未初始化，请先完成欢迎安装流程' };
    }
    const user = getAuthUser(req);
    if (!user) return { ok: false, status: 401, message: '未登录' };
    return { ok: true, initialized, user };
  }

  return { ok: true, initialized, user: null };
};
