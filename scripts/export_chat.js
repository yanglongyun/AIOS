import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const sessionId = '03fb72dd-7abf-4df2-91e4-ed7739d477fd';
const dbPath = path.resolve('database/aios.db');
const db = new Database(dbPath);

const rows = db.prepare('SELECT message FROM messages WHERE session_id = ? ORDER BY id ASC').all(sessionId);

let md = '# AIOS 对话导出\n\n';
md += '> 会话 ID: ' + sessionId + '\n';
md += '> 导出时间: ' + new Date().toLocaleString() + '\n\n---\n\n';

rows.forEach(row => {
  const msg = JSON.parse(row.message);
  const roleMap = { user: '用户', assistant: 'AI助理', tool: '工具' };
  const role = roleMap[msg.role] || msg.role;

  if (msg.role === 'user' || (msg.role === 'assistant' && msg.content)) {
    md += '## ' + role + '\n\n' + (msg.content || '') + '\n\n';
  } else if (msg.tool_calls) {
    md += '## ' + role + ' (调用工具)\n\n';
    msg.tool_calls.forEach(tc => {
      const args = JSON.parse(tc.function.arguments);
      md += '- **' + tc.function.name + '**: `' + (args.command || '') + '`\n';
      if (args.reason) md += '  > ' + args.reason + '\n';
    });
    md += '\n';
  } else if (msg.role === 'tool') {
    md += '### 工具返回结果\n\n```\n' + msg.content + '\n```\n\n';
  }
});

const filename = `chat_export_${Date.now()}.md`;
const dir = path.resolve('uploads');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);
const filePath = path.join(dir, filename);

fs.writeFileSync(filePath, md);
console.log(filename);
