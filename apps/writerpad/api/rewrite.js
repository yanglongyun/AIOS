import { db } from '../../db/client.js';

const callRewriteModel = async ({ mode, fullContent, selectedText, instruction, history }) => {
  const system = mode === 'local'
    ? '你是写作重写助手。你只重写给定的片段，保持原意并提升表达质量。只返回重写后的片段，不要解释，不要代码块。'
    : '你是写作重写助手。你要基于用户要求重写整篇文本，保持核心信息，提升表达质量。只返回重写后的全文，不要解释，不要代码块。';

  const user = mode === 'local'
    ? [
      `整篇原文：\n${fullContent}`,
      `待替换片段：\n${selectedText}`,
      `用户要求：\n${instruction}`,
      `近期对话：${JSON.stringify(history)}`
    ].join('\n\n')
    : [
      `原文：\n${fullContent}`,
      `用户要求：\n${instruction}`,
      `近期对话：${JSON.stringify(history)}`
    ].join('\n\n');

  const res = await fetch('http://localhost:9700/api/llm/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `LLM request failed: ${res.status}`);
  }
  return String(data.message?.content || '').trim();
};

export const rewriteHandler = async (body = {}) => {
  const docId = String(body.docId || '').trim();
  const mode = body.mode === 'local' ? 'local' : 'global';
  const instruction = String(body.instruction || '').trim();
  const currentContent = String(body.content || '');
  const title = String(body.title || '').trim() || '写字板';
  const selectionStart = Number.isInteger(body.selectionStart) ? body.selectionStart : -1;
  const selectionEnd = Number.isInteger(body.selectionEnd) ? body.selectionEnd : -1;
  const history = Array.isArray(body.messages) ? body.messages.slice(-10) : [];

  if (!docId) return { status: 400, message: 'docId is required' };
  if (!instruction) return { status: 400, message: 'instruction is required' };

  const selectedText = mode === 'local' && selectionStart >= 0 && selectionEnd > selectionStart
    ? currentContent.slice(selectionStart, selectionEnd)
    : '';
  if (mode === 'local' && !selectedText) {
    return { status: 400, message: 'local mode requires selected text' };
  }

  let rewritten = '';
  try {
    rewritten = await callRewriteModel({
      mode,
      fullContent: currentContent,
      selectedText,
      instruction,
      history
    });
  } catch (error) {
    return { status: 500, message: error.message || 'rewrite failed' };
  }

  if (!rewritten) return { status: 500, message: 'empty rewrite result' };

  const nextContent = mode === 'local'
    ? `${currentContent.slice(0, selectionStart)}${rewritten}${currentContent.slice(selectionEnd)}`
    : rewritten;

  const tx = db.transaction(() => {
    const exists = db.prepare('SELECT id FROM apps_writerpad_docs WHERE id = ?').get(docId);
    if (exists) {
      db.prepare(`
        UPDATE apps_writerpad_docs
        SET title = ?, content = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(title, nextContent, docId);
    } else {
      db.prepare(`
        INSERT INTO apps_writerpad_docs (id, title, content, updated_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(docId, title, nextContent);
    }

    db.prepare(`
      INSERT INTO apps_writerpad_messages (doc_id, role, content, mode)
      VALUES (?, 'user', ?, ?)
    `).run(docId, instruction, mode);

    db.prepare(`
      INSERT INTO apps_writerpad_messages (doc_id, role, content, mode)
      VALUES (?, 'assistant', ?, ?)
    `).run(docId, rewritten, mode);
  });
  tx();

  return {
    success: true,
    docId,
    mode,
    content: nextContent,
    rewritten
  };
};
