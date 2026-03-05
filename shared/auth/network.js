export const isLoopback = (req) => {
  const ip = String(req?.socket?.remoteAddress || '');
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
};

export const isLocalCliBypass = (req, path = '', method = '') => {
  if (String(req?.headers?.['x-aios-cli'] || '') !== '1') return false;
  if (!isLoopback(req)) return false;
  if (!path) return true;
  if (!method) return path === '/api/chat/create';
  return path === '/api/chat/create' && method === 'POST';
};
