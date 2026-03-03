import { json } from './utils/json.js';
import { handleChatApi } from './chat/index.js';
import { handleSettingsApi } from './settings/index.js';
import { handleLlmApi } from './llm/index.js';
import { handleFilesApi } from './files/index.js';
import { handleTaskApi } from './task/index.js';
import { handleNotificationsApi } from './notifications/index.js';
import { handleAvatarApi } from './avatar/index.js';

export const handleApiRequest = async (req, res, url) => {
  const path = url.pathname;

  try {
    if (path === '/api/health') {
      json(res, { success: true });
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

    if (path.startsWith('/api/llm')) {
      await handleLlmApi(req, res, path);
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

    if (path.startsWith('/api/avatar')) {
      await handleAvatarApi(req, res, path);
      return true;
    }

    json(res, { success: false, message: 'API endpoint not found' }, 404);
    return true;
  } catch (error) {
    json(res, { success: false, message: error.message || 'Internal server error' }, 500);
    return true;
  }
};
