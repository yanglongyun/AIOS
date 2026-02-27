import { json } from './utils/json.js';
import { handleChatApi } from './chat/index.js';
import { handleSettingsApi } from './settings/index.js';
import { handleLlmApi } from './llm/index.js';

export const handleApiRequest = async (req, res, url) => {
  const path = url.pathname;

  try {
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

    json(res, { success: false, message: 'API endpoint not found' }, 404);
    return true;
  } catch (error) {
    json(res, { success: false, message: error.message || 'Internal server error' }, 500);
    return true;
  }
};
