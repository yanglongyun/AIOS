import { json } from '../../utils/json.js';
import { readBody } from '../../utils/readBody.js';
import { initSmartlistDatabase, getLists, getListDetail, createList, toggleStar, deleteList, deleteItem } from './db.js';

export { initSmartlistDatabase };

export async function handleSmartlistApi(req, res, path) {
  // GET /api/apps/smartlist/list - 获取所有列表
  if (path === '/api/apps/smartlist/list' && req.method === 'GET') {
    return json(res, { success: true, data: getLists() });
  }
  
  // GET /api/apps/smartlist/detail?id=xxx - 获取列表详情
  if (path === '/api/apps/smartlist/detail' && req.method === 'GET') {
    const url = new URL(req.url, `http://localhost`);
    const id = url.searchParams.get('id');
    if (!id) return json(res, { success: false, message: 'Missing id' }, 400);
    const detail = getListDetail(parseInt(id));
    if (!detail) return json(res, { success: false, message: 'List not found' }, 404);
    return json(res, { success: true, data: detail });
  }
  
  // POST /api/apps/smartlist/create - 创建列表（AI 生成）
  if (path === '/api/apps/smartlist/create' && req.method === 'POST') {
    const { topic } = await readBody(req);
    if (!topic) return json(res, { success: false, message: 'Missing topic' }, 400);
    
    // 调用 AI 生成列表
    const aiResponse = await fetch('http://localhost:9700/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a smart list generator. For a given topic, generate a list of 5-10 relevant items. Return ONLY a JSON array of strings, no other text.' },
          { role: 'user', content: `Generate a list about: ${topic}` }
        ]
      })
    });
    
    const aiData = await aiResponse.json();
    let items = [];
    
    try {
      const content = aiData.messages?.[aiData.messages.length - 1]?.content || '[]';
      items = JSON.parse(content);
      if (!Array.isArray(items)) items = [];
    } catch (e) {
      items = ['Item 1', 'Item 2', 'Item 3'];
    }
    
    const listId = createList(topic, items);
    return json(res, { success: true, data: { id: listId, topic, items } });
  }
  
  // POST /api/apps/smartlist/star - 切换星星
  if (path === '/api/apps/smartlist/star' && req.method === 'POST') {
    const { itemId } = await readBody(req);
    if (!itemId) return json(res, { success: false, message: 'Missing itemId' }, 400);
    const newStarred = toggleStar(parseInt(itemId));
    return json(res, { success: true, starred: newStarred });
  }
  
  // POST /api/apps/smartlist/delete - 删除列表
  if (path === '/api/apps/smartlist/delete' && req.method === 'POST') {
    const { id } = await readBody(req);
    if (!id) return json(res, { success: false, message: 'Missing id' }, 400);
    deleteList(parseInt(id));
    return json(res, { success: true });
  }
  
  // POST /api/apps/smartlist/delete-item - 删除单项
  if (path === '/api/apps/smartlist/delete-item' && req.method === 'POST') {
    const { id } = await readBody(req);
    if (!id) return json(res, { success: false, message: 'Missing id' }, 400);
    deleteItem(parseInt(id));
    return json(res, { success: true });
  }
  
  return false;
}
