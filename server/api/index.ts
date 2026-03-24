import { json } from '../../shared/http/json.ts';
import { handleChatApi } from './chat.ts';
import { handleSettingsApi } from './settings.ts';
import { handleFilesApi } from '../../apps/files/api/index.ts';
import { handleTaskApi } from './task.ts';
import { handleAuthApi } from './auth/index.ts';
import { handleSystemApi } from './system.ts';
import { access } from '../../shared/auth/index.ts';

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

    if (path.startsWith('/api/system/')) {
      await handleSystemApi(req, res, path);
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

    json(res, { success: false, message: 'API endpoint not found' }, 404);
    return true;
  } catch (error) {
    json(res, { success: false, message: error.message || 'Internal server error' }, 500);
    return true;
  }
};
