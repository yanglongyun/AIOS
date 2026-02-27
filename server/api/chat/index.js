import { readBody } from '../utils/readBody.js';
import { json } from '../utils/json.js';
import { listChats } from './list.js';
import { createChat } from './create.js';
import { getChatMessagesPaged } from './messages.js';
import { renameChat } from './rename.js';
import { deleteChat } from './delete.js';

export const handleChatApi = async (req, res, path, url) => {
  if (path === '/api/chat/list' && req.method === 'GET') return json(res, listChats());

  if (path === '/api/chat/create' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, createChat(body.title || '新对话'));
  }

  if (path === '/api/chat/messages' && req.method === 'GET') {
    const chatId = url.searchParams.get('chatId');
    if (!chatId) return json(res, { error: '缺少 chatId' }, 400);
    const limit = Number(url.searchParams.get('limit') || 20);
    const offset = Number(url.searchParams.get('offset') || 0);
    return json(res, getChatMessagesPaged(chatId, limit, offset));
  }

  if (path === '/api/chat/rename' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body.chatId) return json(res, { error: '缺少 chatId' }, 400);
    if (!body.title) return json(res, { error: '缺少 title' }, 400);
    return json(res, renameChat(body.chatId, body.title));
  }

  if (path === '/api/chat/delete' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body.chatId) return json(res, { error: '缺少 chatId' }, 400);
    return json(res, deleteChat(body.chatId));
  }

  return json(res, { error: 'API endpoint not found' }, 404);
};
