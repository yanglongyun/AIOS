import crypto from 'crypto';
import { db } from '../db.js';

const toArray = (value, fallback = []) => (Array.isArray(value) ? value : fallback);

const safeJsonParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeNode = (node = {}) => {
  const id = String(node.id || '').trim() || crypto.randomUUID().slice(0, 8);
  return {
    id,
    text: String(node.text || ''),
    note: node.note == null ? '' : String(node.note),
    children: toArray(node.children).map((child) => normalizeNode(child))
  };
};

const normalizeNodes = (nodes = []) => toArray(nodes).map((node) => normalizeNode(node));

const findNode = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(toArray(node.children), id);
    if (found) return found;
  }
  return null;
};

const findParent = (nodes, childId) => {
  for (const node of nodes) {
    if (toArray(node.children).some((child) => child.id === childId)) return node;
    const found = findParent(toArray(node.children), childId);
    if (found) return found;
  }
  return null;
};

const applyOps = (currentNodes = [], ops = []) => {
  let outline = normalizeNodes(currentNodes);

  for (const item of toArray(ops)) {
    const op = String(item?.op || '');
    const args = item?.args || {};

    if (op === 'create_outline') {
      outline = normalizeNodes(args.nodes);
      continue;
    }

    if (op === 'add_nodes') {
      const parentId = String(args.parentId || 'root');
      const nodes = normalizeNodes(args.nodes);
      if (parentId === 'root') {
        outline.push(...nodes);
      } else {
        const parent = findNode(outline, parentId);
        if (parent) parent.children = [...toArray(parent.children), ...nodes];
      }
      continue;
    }

    if (op === 'update_node') {
      const node = findNode(outline, String(args.id || ''));
      if (node) {
        if (args.text !== undefined) node.text = String(args.text || '');
        if (args.note !== undefined) node.note = String(args.note || '');
      }
      continue;
    }

    if (op === 'delete_node') {
      const id = String(args.id || '');
      if (!id) continue;
      const rootIndex = outline.findIndex((node) => node.id === id);
      if (rootIndex >= 0) {
        outline.splice(rootIndex, 1);
      } else {
        const parent = findParent(outline, id);
        if (parent) {
          parent.children = toArray(parent.children).filter((child) => child.id !== id);
        }
      }
    }
  }

  return outline;
};

const normalizeStructured = (rawText = '') => {
  const text = String(rawText || '').trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payload = safeJsonParse((fenced ? fenced[1] : text).trim(), null);
  if (!payload || typeof payload !== 'object') return null;

  const reply = String(payload.reply || '').trim();
  const nextOps = toArray(payload.ops).map((item) => ({
    op: String(item?.op || '').trim(),
    args: item?.args || {}
  })).filter((item) => item.op);

  return { reply, ops: nextOps };
};

export const chatHandler = async (body = {}) => {
  const outlineId = String(body.outlineId || '').trim();
  const newMessage = String(body.newMessage || body.message || '').trim();
  if (!outlineId) return { status: 400, message: 'outlineId is required' };
  if (!newMessage) return { status: 400, message: 'message is required' };

  const currentOutline = db.prepare(`
    SELECT id, title, data
    FROM apps_mindtree_docs
    WHERE id = ?
  `).get(outlineId);

  const baseTitle = String(body.title || currentOutline?.title || '心树').trim() || '心树';
  const incomingNodes = Array.isArray(body.outlineData) ? body.outlineData : safeJsonParse(currentOutline?.data || '[]', []);
  const normalizedNodes = normalizeNodes(incomingNodes);

  const history = toArray(body.messages)
    .filter((item) => item?.role === 'user' || item?.role === 'assistant')
    .slice(-10)
    .map((item) => ({
      role: item.role,
      text: String(item?.content?.[0]?.text || item?.content || '')
    }));

  const systemPrompt = [
    '你是 Outliner Assistant，帮助用户编辑层级大纲。',
    '你必须根据用户消息判断是否需要操作大纲，并返回结构化 JSON。',
    '只返回 JSON，不要 markdown，不要解释。',
    '输出格式：{"reply":"给用户的简短回复","ops":[{"op":"create_outline|add_nodes|update_node|delete_node","args":{...}}]}',
    '操作说明：',
    '- create_outline: args = { nodes: Node[] }',
    '- add_nodes: args = { parentId: "root|节点id", nodes: Node[] }',
    '- update_node: args = { id: "节点id", text?: "新文本", note?: "新备注" }',
    '- delete_node: args = { id: "节点id" }',
    'Node 结构：{ id: string, text: string, note?: string, children?: Node[] }',
    '如果用户只是闲聊或询问说明，可不改动大纲，返回 ops: []。',
    '节点 id 不能重复。'
  ].join('\n');

  const userPayload = [
    `当前大纲标题: ${baseTitle}`,
    `当前大纲 JSON: ${JSON.stringify(normalizedNodes)}`,
    `近期对话: ${JSON.stringify(history)}`,
    `用户消息: ${newMessage}`
  ].join('\n');

  let reply = '';
  let ops = [];
  try {
    const res = await fetch('http://localhost:9700/api/llm/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPayload }
        ]
      })
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      return { status: 500, message: data.message || `LLM request failed: ${res.status}` };
    }

    const structured = normalizeStructured(data.message?.content || '');
    if (!structured) {
      reply = String(data.message?.content || '我已收到。').trim();
      ops = [];
    } else {
      reply = structured.reply || '已完成。';
      ops = structured.ops;
    }
  } catch (error) {
    return { status: 500, message: error.message || 'chat failed' };
  }

  const nextNodes = applyOps(normalizedNodes, ops);

  const tx = db.transaction(() => {
    const exists = db.prepare('SELECT id FROM apps_mindtree_docs WHERE id = ?').get(outlineId);
    if (exists) {
      db.prepare(`
        UPDATE apps_mindtree_docs
        SET title = ?, data = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(baseTitle, JSON.stringify(nextNodes), outlineId);
    } else {
      db.prepare(`
        INSERT INTO apps_mindtree_docs (id, title, data, updated_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(outlineId, baseTitle, JSON.stringify(nextNodes));
    }

    db.prepare(`
      INSERT INTO apps_mindtree_messages (outline_id, role, content)
      VALUES (?, 'user', ?)
    `).run(outlineId, newMessage);

    db.prepare(`
      INSERT INTO apps_mindtree_messages (outline_id, role, content)
      VALUES (?, 'assistant', ?)
    `).run(outlineId, reply);
  });
  tx();

  return {
    success: true,
    outlineId,
    title: baseTitle,
    reply,
    ops,
    outlineData: nextNodes
  };
};
