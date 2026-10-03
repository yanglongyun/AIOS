// 当前数据库结构；建表语句不包含版本判断或迁移。
export const SCHEMA = `
    -- 文件树展示真实目录和文件;对话独立保存在数据库。
    -- 用户对话的运行状态保存在内存，消息过程落库；应用任务另行保存任务状态。

    CREATE TABLE IF NOT EXISTS chats (
      id           TEXT PRIMARY KEY,
      -- 发起方:NULL = 用户自己开的会话;非 NULL = 该应用触发的任务(不进会话列表)
      origin_app   TEXT,
      title        TEXT NOT NULL,
      system       TEXT,
      pinned       INTEGER NOT NULL DEFAULT 0,
      last_read_at TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 消息:一行一个 Responses item(思考 / 正文 / 工具调用 / 结果),逐条落库
    CREATE TABLE IF NOT EXISTS messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id    TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      body       TEXT NOT NULL,
      meta       TEXT,
      usage      TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 压缩:上下文超水位时的摘要,记住它替换了哪一段消息
    CREATE TABLE IF NOT EXISTS compactions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id          TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      start_message_id INTEGER NOT NULL,
      end_message_id   INTEGER NOT NULL,
      summary          TEXT NOT NULL,
      tokens           INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 应用触发的 agent 轮次(/apps/ai/agent)。
    -- 过程与会话同规格:逐条落 messages(id 就是那段会话的 id);这里只记发起方与终局。
    CREATE TABLE IF NOT EXISTS tasks (
      id         TEXT PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE,
      app_id     TEXT NOT NULL,
      prompt     TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','done','error','aborted')),
      error      TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS file_roots (
      id             TEXT PRIMARY KEY,
      title          TEXT NOT NULL,
      path           TEXT NOT NULL UNIQUE,
      enabled        INTEGER NOT NULL DEFAULT 1,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      last_opened_at TEXT
    );

    -- 旧版本留下的表:规则(已取消)、桌面版浏览器的密码/收藏/历史(服务器版不用)
    DROP TABLE IF EXISTS settings_rules;
    DROP TABLE IF EXISTS browser_passwords;
    DROP TABLE IF EXISTS browser_bookmarks;
    DROP TABLE IF EXISTS browser_history;

    CREATE INDEX IF NOT EXISTS idx_messages_chat    ON messages(chat_id, id);
    CREATE INDEX IF NOT EXISTS idx_compactions_chat ON compactions(chat_id, id);
`;
