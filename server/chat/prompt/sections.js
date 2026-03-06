export const buildLanguageSection = (language) => {
  return `\n\n## 语言\n使用 ${language || 'zh'} 与用户交流。`;
};

export const buildMemorySection = (overview) => {
  if (!overview) return '';
  return `\n\n## 记忆\n${overview}`;
};

export const buildEnvironmentSection = (cwd) => {
  return `\n\n## 环境
- 项目根目录：${cwd}
- 系统数据库：${cwd}/database/aios.db（SQLite，表：chats, messages, settings）
- 应用数据库目录：${cwd}/database/apps/（SQLite，每个应用独立 db 文件）
- 文件系统目录：${cwd}/files/
- 上传目录：${cwd}/files/uploads/
- 导出目录：${cwd}/files/exports/
- 记忆目录：${cwd}/memory/（index.md 为索引，按需 cat 具体文件）`;
};

export const buildModelSection = ({ provider, model, apiUrl }) => {
  return `\n\n## 当前模型配置
- 供应方：${provider || '-'}
- 模型：${model || '-'}
- 请求地址：${apiUrl || '-'}`;
};

export const buildToolSection = ({
  enableToolResultTruncate,
  toolResultMaxChars,
  enableToolLoopLimit,
  toolMaxRounds
}) => {
  return `\n\n## 工具配置
- 工具结果截断：${enableToolResultTruncate ? '开启' : '关闭'}
- 工具结果最大长度：${toolResultMaxChars ?? '-'}
- 工具循环限制：${enableToolLoopLimit ? '开启' : '关闭'}
- 工具最大循环轮次：${toolMaxRounds ?? '-'}`;
};

export const buildAppsSection = (appsCatalog) => {
  if (!Array.isArray(appsCatalog) || appsCatalog.length === 0) {
    return `\n\n## 应用目录\n你可以帮助用户构建应用、使用应用、管理应用。`;
  }
  const lines = appsCatalog.map((app, i) => {
    const summary = app.summary ? ` - ${app.summary}` : '';
    return `${i + 1}. ${app.id} | ${app.title}${summary}`;
  });
  return `\n\n## 应用目录\n你可以帮助用户构建应用、使用应用、管理应用。\n${lines.join('\n')}`;
};

export const buildVisibleScriptsSection = (scriptsCatalog) => {
  if (!Array.isArray(scriptsCatalog) || scriptsCatalog.length === 0) return '';
  const lines = scriptsCatalog.map((script, i) => {
    return `${i + 1}. name: ${script.name || '-'} | description: ${
      script.description || '-'
    } | usage: ${script.usage || '-'}`;
  });
  return `\n\n## 可见脚本
以下脚本已标记为可见，可按需建议用户使用（仅展示 name/description/usage）：\n${lines.join('\n')}`;
};

export const buildSessionContextSection = (currentConversationId, recentChats) => {
  const currentId = String(currentConversationId || '').trim();
  if (!currentId && (!Array.isArray(recentChats) || recentChats.length === 0)) return '';

  const recentLines = (Array.isArray(recentChats) ? recentChats : [])
    .slice(0, 3)
    .map((c, i) => `${i + 1}. ${c.title || '未命名'} ｜ ${String(c.description || '').slice(0, 100)}`);

  let block = `\n\n## 会话上下文`;
  if (currentId) {
    block += `\n- 当前会话ID：${currentId}`;
  }
  if (recentLines.length) {
    block += `\n- 最近 3 次会话（标题｜描述前100字）：\n${recentLines.join('\n')}`;
  }
  return block;
};

export const buildUnreadNotificationSection = (unread) => {
  if (!(unread > 0)) return '';
  return `\n\n## 通知
你有 ${unread} 条未读通知。可以用 shell 执行 \`curl http://localhost:9700/api/notifications\` 查看详情，用 \`curl -X POST http://localhost:9700/api/notifications/read -H 'Content-Type: application/json' -d '{"id":通知ID,"reply":"处理说明"}'\` 标记已读。`;
};
