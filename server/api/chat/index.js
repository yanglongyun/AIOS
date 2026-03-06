import { readBody } from '../../../shared/http/readBody.js';
import { json } from '../../../shared/http/json.js';
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
    const conversationId = url.searchParams.get('conversationId');
    if (!conversationId) return json(res, { error: '缺少 conversationId' }, 400);
    const limit = Number(url.searchParams.get('limit') || 20);
    const offset = Number(url.searchParams.get('offset') || 0);
    return json(res, getChatMessagesPaged(conversationId, limit, offset));
  }

  if (path === '/api/chat/rename' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body.conversationId) return json(res, { error: '缺少 conversationId' }, 400);
    if (!body.title) return json(res, { error: '缺少 title' }, 400);
    return json(res, renameChat(body.conversationId, body.title));
  }

  if (path === '/api/chat/delete' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body.conversationId) return json(res, { error: '缺少 conversationId' }, 400);
    return json(res, deleteChat(body.conversationId));
  }

  return json(res, { error: 'API endpoint not found' }, 404);
};
