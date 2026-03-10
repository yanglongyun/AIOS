import { countUsers, getInternalApiToken } from './repository.js';
import { getAuthUser } from './guard.js';

export const normalizeUsername = (value) => String(value || '').trim().toLowerCase();

const isLoopbackIp = (ip) => {
  const value = String(ip || '').trim();
  return value === '127.0.0.1' || value === '::1' || value === '::ffff:127.0.0.1';
};

const firstForwardedIp = (req) => {
  const raw = String(req?.headers?.['x-forwarded-for'] || '').trim();
  if (!raw) return '';
  return raw.split(',')[0].trim();
};

const isTrustedLocalRequest = (req) => {
  // Internal token is only for direct local calls from runtime itself.
  // Never trust X-Forwarded-For here; it can be client-controlled in many deployments.
  const forwarded = firstForwardedIp(req);
  if (forwarded) return false;
  return isLoopbackIp(req?.socket?.remoteAddress || '');
};

const readInternalToken = () => {
  return String(getInternalApiToken() || '').trim();
};

const readBearerToken = (req) => {
  const auth = String(req?.headers?.authorization || '').trim();
  if (!auth) return '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || '').trim() : '';
};

const getInternalActor = (req, path, scope) => {
  if (scope !== 'server-api') return null;
  if (!String(path || '').startsWith('/api/')) return null;
  if (!isTrustedLocalRequest(req)) return null;

  const internalToken = readInternalToken();
  if (!internalToken) return null;
  const token = readBearerToken(req);
  if (!token || token !== internalToken) return null;

  return {
    id: 0,
    username: 'internal-agent',
    role: 'system',
    internal: true
  };
};

const allowServerPublic = (path, method) => {
  return path === '/api/health' || path.startsWith('/api/auth/') || path.startsWith('/api/setup/');
};

const allowServerDuringSetup = (path, method) => {
  return (path === '/api/settings' && (method === 'GET' || method === 'POST'))
    || (path === '/api/task/create/instant' && method === 'POST')
    || (path === '/api/task/create/agent' && method === 'POST');
};

const allowAppsPublic = (path) => {
  return path === '/apps/health';
};

// 唯一对外入口：调用方只需要 access(...) 即可完成鉴权/初始化门禁。
export const access = (req, path, method, scope) => {
  const initialized = countUsers() > 0;
  const internalActor = getInternalActor(req, path, scope);

  if (scope === 'server-api') {
    if (internalActor) {
      return { ok: true, initialized, user: internalActor };
    }
    if (allowServerPublic(path, method)) {
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
