import { json } from '../utils/json.js';
import { readBody } from '../utils/readBody.js';
import { 
  initOutlineDatabase, 
  getNodes, 
  createNode, 
  updateNode, 
  deleteNode,
  getRootNodes,
  getChildNodes 
} from './db.js';

export { initOutlineDatabase };

export async function handleOutlineApi(req, res, path) {
  // 获取所有节点（树形结构）
  if (path === '/api/apps/outline/list' && req.method === 'GET') {
    const nodes = getNodes();
    // 构建树形结构
    const tree = buildTree(nodes);
    return json(res, { success: true, data: tree });
  }
  
  // 创建节点
  if (path === '/api/apps/outline/create' && req.method === 'POST') {
    const { parent_id, topic } = await readBody(req);
    const result = createNode(parent_id, topic);
    return json(res, { success: true, id: result.lastInsertRowid });
  }
  
  // 更新节点
  if (path === '/api/apps/outline/update' && req.method === 'POST') {
    const { id, topic } = await readBody(req);
    updateNode(id, topic);
    return json(res, { success: true });
  }
  
  // 删除节点
  if (path === '/api/apps/outline/delete' && req.method === 'POST') {
    const { id } = await readBody(req);
    deleteNode(id);
    return json(res, { success: true });
  }
  
  return false;
}

// 构建树形结构
function buildTree(nodes) {
  const map = {};
  const roots = [];
  
  // 先创建所有节点的映射
  nodes.forEach(node => {
    map[node.id] = { ...node, children: [] };
  });
  
  // 构建父子关系
  nodes.forEach(node => {
    if (node.parent_id === null) {
      roots.push(map[node.id]);
    } else if (map[node.parent_id]) {
      map[node.parent_id].children.push(map[node.id]);
    }
  });
  
  return roots;
}
