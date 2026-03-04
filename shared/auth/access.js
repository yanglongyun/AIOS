import { countUsers } from './repository.js';
import { getAuthUser } from './guard.js';

const allowServerPublic = (path) => {
  return path === '/api/health' || path.startsWith('/api/auth/') || path.startsWith('/api/setup/');
};

const allowServerDuringSetup = (path, method) => {
  return (path === '/api/settings' && (method === 'GET' || method === 'POST'))
    || (path === '/api/llm/chat' && method === 'POST');
};

const allowAppsPublic = (path) => {
  return path === '/apps/health' || path === '/apps/inbox/submit' || path.startsWith('/public/');
};

export const checkAccess = ({ scope, req, path, method }) => {
  const initialized = countUsers() > 0;

  if (scope === 'server-api') {
    if (allowServerPublic(path)) {
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
