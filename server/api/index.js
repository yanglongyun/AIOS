import { json } from '../../shared/http/json.js';
import { handleChatApi } from './chat/index.js';
import { handleSettingsApi } from './settings/index.js';
import { handleFilesApi } from './files/index.js';
import { handleTaskApi } from './task/index.js';
import { handleNotificationsApi } from './notifications/index.js';
import { handleAuthApi } from './auth/index.js';
import { handleSetupApi } from './setup/index.js';
import { access } from '../../shared/auth/index.js';

export const handleApiRequest = async (req, res, url) => {
  const path = url.pathname;

  try {
    const gate = access(req, path, req.method || 'GET', 'server-api');
    if (!gate.ok) {
      json(res, { success: false, message: gate.message }, gate.status || 401);
      return true;
    }

    if (path === '/api/health') {
      json(res, { success: true });
      return true;
    }

    if (path.startsWith('/api/auth/')) {
      await handleAuthApi(req, res, path);
      return true;
    }

    if (path.startsWith('/api/setup/')) {
      await handleSetupApi(req, res, path);
      return true;
    }

    if (path.startsWith('/api/chat/')) {
      await handleChatApi(req, res, path, url);
      return true;
    }

    if (path.startsWith('/api/settings')) {
      await handleSettingsApi(req, res, path);
      return true;
    }

    if (path.startsWith('/api/files/')) {
      await handleFilesApi(req, res, path);
      return true;
    }

    if (path.startsWith('/api/task')) {
      await handleTaskApi(req, res, path, url);
      return true;
    }

    if (path.startsWith('/api/notifications')) {
      await handleNotificationsApi(req, res, path, url);
      return true;
    }

    json(res, { success: false, message: 'API endpoint not found' }, 404);
    return true;
  } catch (error) {
    json(res, { success: false, message: error.message || 'Internal server error' }, 500);
    return true;
  }
};
