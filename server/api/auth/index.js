import { json } from '../../../shared/http/json.js';
import { login } from './login.js';
import { register } from './register.js';
import { logout } from './logout.js';
import { me } from './me.js';
import { changePassword } from './password.js';

export const handleAuthApi = async (req, res, path) => {
  if (path === '/api/auth/register' && req.method === 'POST') return register(req, res);
  if (path === '/api/auth/login' && req.method === 'POST') return login(req, res);
  if (path === '/api/auth/logout' && req.method === 'POST') return logout(req, res);
  if (path === '/api/auth/me' && req.method === 'GET') return me(req, res);
  if (path === '/api/auth/password' && req.method === 'POST') return changePassword(req, res);
  return json(res, { success: false, message: 'API endpoint not found' }, 404);
};
