import { readBody } from '../../shared/http/readBody.ts';
import { json } from '../../shared/http/json.ts';
import { hasChat, createChat } from '../chat/chats.ts';
import { listChats } from '../service/chat/list.ts';
import { getChatMessagesPaged } from '../service/chat/messages.ts';
import { renameChat } from '../service/chat/rename.ts';
import { deleteChat } from '../service/chat/delete.ts';

export const handleChatApi = async (req, res, path, url) => {
  if (path === '/api/chat/list' && req.method === 'GET') {
    const scene = url.searchParams.get('scene') || null;
    return json(res, listChats(scene));
  }

  if (path === '/api/chat/create' && req.method === 'POST') {
    const body = await readBody(req);
    return json(res, createChat(body.title || '新对话', body.scene || 'chat', body.meta || null));
  }

  if (path === '/api/chat/messages' && req.method === 'GET') {
    const conversationId = url.searchParams.get('conversationId');
    if (!conversationId) return json(res, { error: '缺少 conversationId' }, 400);
    if (!hasChat(conversationId)) return json(res, { error: '会话不存在' }, 404);
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

