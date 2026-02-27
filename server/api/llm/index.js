import { handleLlmChat } from './chat.js';
import { json } from '../utils/json.js';

export const handleLlmApi = async (req, res, path) => {
  if (req.method === 'POST' && path === '/api/llm/chat') {
    return handleLlmChat(req, res);
  }

  json(res, { success: false, message: 'Not found' }, 404);
};
