<template>
  <div class="inbox-root">

    <!-- 顶部 -->
    <div class="inbox-header">
      <h1>收件箱 <span>📬</span></h1>
      <span v-if="unread > 0" class="inbox-unread-badge">{{ unread }} 封未读</span>
    </div>

    <!-- 公开链接 -->
    <div class="inbox-public-bar">
      <div class="inbox-public-left">
        <div class="inbox-public-label">📮 对外投信地址</div>
        <div class="inbox-public-url">{{ publicUrl }}</div>
      </div>
      <button class="inbox-btn-copy" @click="copySubmitUrl">{{ copied ? '已复制 ✓' : '复制地址' }}</button>
    </div>

    <!-- 工具栏 -->
    <div class="inbox-toolbar">
      <div class="inbox-toolbar-left">
        <button class="inbox-filter-btn" :class="{ active: readFilter === 'all' }" @click="readFilter = 'all'; fetchMessages()">全部</button>
        <button class="inbox-filter-btn" :class="{ active: readFilter === 'unread' }" @click="readFilter = 'unread'; fetchMessages()">未读</button>
        <button class="inbox-filter-btn" :class="{ active: readFilter === 'read' }" @click="readFilter = 'read'; fetchMessages()">已读</button>
      </div>
      <span class="inbox-toolbar-count">{{ messages.length }} 封信件</span>
    </div>

    <!-- 信件列表 -->
    <div class="inbox-scroll">
      <div v-if="!messages.length" class="inbox-empty">
        <span class="inbox-empty-icon">📭</span>
        <p>暂无来信</p>
      </div>

      <div
        v-for="m in messages" :key="m.id"
        class="inbox-mail-card"
        :class="{ unread: !m.is_read }"
      >
        <!-- 未读蜡封 -->
        <div v-if="!m.is_read" class="inbox-wax">新</div>

        <!-- 发件人 -->
        <div class="inbox-sender">
          <div class="inbox-sender-avatar">{{ getSenderEmoji(m.name) }}</div>
          <div>
            <div class="inbox-sender-name">{{ m.name || '匿名' }}</div>
            <div class="inbox-sender-email">{{ m.email || '无邮箱' }}</div>
          </div>
        </div>

        <!-- 信件正文 -->
        <div class="inbox-body">{{ m.content }}</div>

        <!-- 底部 -->
        <div class="inbox-footer">
          <span class="inbox-meta">📅 {{ formatDate(m.created_at) }} · 🌐 {{ m.source_ip || 'unknown' }}</span>
          <div class="inbox-actions">
            <button @click="toggleRead(m)">{{ m.is_read ? '标未读' : '标已读' }}</button>
            <button class="danger" @click="remove(m.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部邮戳 -->
    <div class="inbox-postmark">📮 AIOS 邮局 · 本地投递</div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const API_BASE = 'http://localhost:9701/api/apps/inbox';
const publicUrl = 'http://localhost:9701/inbox/submit';

const messages = ref([]);
const unread = ref(0);
const readFilter = ref('all');
const copied = ref(false);

const fetchMessages = async () => {
  const params = new URLSearchParams({ read: readFilter.value });
  const res = await fetch(`${API_BASE}/list?${params.toString()}`);
  const data = await res.json();
  messages.value = data.data || [];
  unread.value = Number(data.unread || 0);
};

const toggleRead = async (m) => {
  await fetch(`${API_BASE}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: m.id, isRead: !m.is_read })
  });
  fetchMessages();
};

const remove = async (id) => {
  await fetch(`${API_BASE}/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  fetchMessages();
};

const copySubmitUrl = async () => {
  try {
    await navigator.clipboard.writeText(publicUrl);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 1500);
  } catch {}
};

const formatDate = (v) => {
  if (!v) return '';
  const d = new Date(v.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return v;
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const senderEmojis = ['🧑', '👩', '👨‍💻', '🎨', '🌍', '🤖', '👾', '🦊', '🐱', '🐻'];
const getSenderEmoji = (name) => {
  if (!name) return '🤖';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return senderEmojis[Math.abs(hash) % senderEmojis.length];
};

onMounted(fetchMessages);
</script>

<style scoped>
.inbox-root {
  font-family: 'Georgia', 'PingFang SC', serif;
  background: #f0ebe3;
  background-image:
    radial-gradient(circle at 30% 70%, rgba(139,90,43,0.03) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(139,90,43,0.02) 0%, transparent 40%);
  color: #5a5048;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 木桌纹理 */
.inbox-root::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 80px,
    rgba(139,90,43,0.015) 80px,
    rgba(139,90,43,0.015) 81px
  );
  pointer-events: none;
}

/* 顶部 */
.inbox-header {
  padding: 24px 24px 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
.inbox-header h1 {
  font-size: 24px;
  font-weight: 800;
  color: #7a6a58;
  font-style: italic;
}
.inbox-header h1 span { font-size: 20px; margin-left: 4px; }
.inbox-unread-badge {
  background: #d4756a;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  font-family: -apple-system, sans-serif;
  box-shadow: 0 2px 6px rgba(212,117,106,0.25);
}

/* 公开链接 */
.inbox-public-bar {
  margin: 16px 24px 0;
  padding: 14px 18px;
  background: #faf6f0;
  border: 1px solid #e8e0d4;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
.inbox-public-left { flex: 1; min-width: 0; }
.inbox-public-label { font-size: 12px; color: #b8a898; font-style: italic; }
.inbox-public-url {
  font-size: 11px;
  color: #9a8a78;
  font-family: 'Courier New', monospace;
  margin-top: 3px;
  word-break: break-all;
}
.inbox-btn-copy {
  padding: 8px 18px;
  background: #8a7a68;
  color: #faf6f0;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Georgia', serif;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 1px;
  transition: all 0.15s;
  white-space: nowrap;
}
.inbox-btn-copy:hover { background: #9a8a78; }

/* 工具栏 */
.inbox-toolbar {
  padding: 16px 24px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}
.inbox-toolbar-left { display: flex; align-items: center; gap: 8px; }
.inbox-filter-btn {
  padding: 6px 14px;
  background: transparent;
  border: 1.5px solid #d4c8b8;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Georgia', serif;
  color: #a89888;
  cursor: pointer;
  transition: all 0.15s;
}
.inbox-filter-btn:hover { background: #f5ead0; }
.inbox-filter-btn.active {
  background: #8a7a68;
  color: #faf6f0;
  border-color: #8a7a68;
}
.inbox-toolbar-count {
  font-size: 11px;
  color: #c4b8a8;
  font-style: italic;
}

/* 滚动区 */
.inbox-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px 24px 24px;
  position: relative;
  z-index: 1;
}
.inbox-scroll::-webkit-scrollbar { width: 0; }

.inbox-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c4b8a8;
  gap: 8px;
}
.inbox-empty-icon { font-size: 48px; opacity: 0.5; }
.inbox-empty p { font-size: 14px; font-style: italic; }

/* 信件卡片 */
.inbox-mail-card {
  background: #faf6f0;
  border: 1px solid #e8e0d4;
  border-radius: 4px;
  padding: 20px 22px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
  position: relative;
  transition: all 0.2s;
  cursor: default;
}
.inbox-mail-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.08);
}

/* 红蓝条纹 */
.inbox-mail-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 6px;
  background: repeating-linear-gradient(
    90deg,
    #d4968e 0, #d4968e 10px,
    #8eaad4 10px, #8eaad4 20px
  );
  border-radius: 4px 4px 0 0;
}

/* 未读 */
.inbox-mail-card.unread {
  border-left: 4px solid #d4968e;
}

/* 蜡封 */
.inbox-wax {
  position: absolute;
  top: 14px; right: 16px;
  width: 32px; height: 32px;
  background: radial-gradient(circle at 40% 35%, #e0887e, #c06858);
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(192,104,88,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: rgba(255,255,255,0.9);
  font-weight: 700;
  font-family: -apple-system, sans-serif;
}

/* 发件人 */
.inbox-sender {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.inbox-sender-avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: #f0e8dc;
  border: 1.5px solid #e0d4c8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.inbox-sender-name {
  font-size: 14px;
  font-weight: 700;
  color: #7a6a58;
}
.inbox-sender-email {
  font-size: 11px;
  color: #b8a898;
  font-style: italic;
}

/* 正文 */
.inbox-body {
  font-size: 14px;
  line-height: 1.8;
  color: #6a5e50;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 10px 0;
  padding-left: 40px;
  background-image: repeating-linear-gradient(
    transparent,
    transparent 27px,
    rgba(180,160,130,0.12) 27px,
    rgba(180,160,130,0.12) 28px
  );
  background-position: 0 2px;
}

/* 底部 */
.inbox-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-left: 40px;
}
.inbox-meta {
  font-size: 11px;
  color: #c4b8a8;
  font-style: italic;
}

.inbox-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.15s;
}
.inbox-mail-card:hover .inbox-actions { opacity: 1; }

.inbox-actions button {
  padding: 5px 14px;
  border: 1.5px solid #e0d4c8;
  background: rgba(255,255,255,0.5);
  border-radius: 4px;
  font-size: 11px;
  font-family: 'Georgia', serif;
  color: #a89888;
  cursor: pointer;
  transition: all 0.15s;
}
.inbox-actions button:hover {
  background: #8a7a68;
  color: #faf6f0;
  border-color: #8a7a68;
}
.inbox-actions button.danger:hover {
  background: #d4756a;
  border-color: #d4756a;
  color: #fff;
}

/* 邮戳底部 */
.inbox-postmark {
  flex-shrink: 0;
  padding: 12px 24px;
  text-align: center;
  font-size: 11px;
  color: #c4b8a8;
  font-style: italic;
  position: relative;
  z-index: 1;
  border-top: 1px dashed #d8d0c4;
}
</style>
