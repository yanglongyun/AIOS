<script setup>
import { computed, ref } from 'vue';

const items = ref([
  { id: 'notebook', name: '记事本', desc: '快速记笔记 + AI 整理摘要', cat: '生产力',  icon: 'edit_note',     color: '#9334e6', installed: true },
  { id: 'finance',  name: '记账本', desc: '记账 / 报表 / 预算 + AI 自动分类', cat: '生活',  icon: 'payments',      color: '#0f9d58', installed: true },
  { id: 'rss',      name: 'RSS 阅读', desc: '订阅源管理 + AI 摘要',  cat: '资讯', icon: 'rss_feed',     color: '#ea4335', installed: false },
  { id: 'cron',     name: '定时任务', desc: '把 cron 转成可视化的图形界面', cat: '系统',  icon: 'schedule',      color: '#1a73e8', installed: false },
  { id: 'docker',   name: 'Docker',  desc: '容器列表 / 启停 / logs / exec', cat: '开发',  icon: 'package_2',    color: '#2496ed', installed: false },
  { id: 'http',     name: 'HTTP 客户端', desc: 'Postman-lite,本机 curl 强化', cat: '开发', icon: 'http',         color: '#fbbc04', installed: false },
  { id: 'logs',     name: '日志', desc: 'tail -f 任意路径 + grep + 跟随', cat: '系统', icon: 'description', color: '#5f6368', installed: false },
  { id: 'mailbox',  name: '邮箱', desc: 'IMAP/SMTP 收发 + AI 总结', cat: '通讯',  icon: 'mail',          color: '#d93025', installed: false }
]);

const cats = computed(() => {
  const counts = new Map();
  items.value.forEach((it) => counts.set(it.cat, (counts.get(it.cat) || 0) + 1));
  return [{ key: 'all', label: '全部', count: items.value.length },
    ...Array.from(counts.entries()).map(([k, c]) => ({ key: k, label: k, count: c }))];
});
const active = ref('all');
const filtered = computed(() => active.value === 'all' ? items.value : items.value.filter((it) => it.cat === active.value));
const selected = ref(null);

function pick(it) { selected.value = it; }
function install(it) { it.installed = true; }
</script>

<template>
  <div class="page">
    <header class="head">
      <h1>应用工坊</h1>
      <span class="dim">{{ items.length }} 款应用</span>
    </header>

    <nav class="cats">
      <button v-for="c in cats" :key="c.key"
        class="cat" :class="{ active: active === c.key }"
        @click="active = c.key">
        {{ c.label }} <span class="ct">{{ c.count }}</span>
      </button>
    </nav>

    <div class="row">
      <div class="grid">
        <div v-for="it in filtered" :key="it.id"
          class="tile" :class="{ active: selected?.id === it.id }"
          @click="pick(it)">
          <div class="ic" :style="{ background: it.color }">
            <span class="msi" style="color:#fff">{{ it.icon }}</span>
          </div>
          <div class="body">
            <div class="t">{{ it.name }}</div>
            <div class="d">{{ it.desc }}</div>
            <div class="meta">
              <span class="cat-chip">{{ it.cat }}</span>
              <span v-if="it.installed" class="installed">已安装</span>
            </div>
          </div>
        </div>
      </div>

      <aside class="detail" v-if="selected">
        <div class="big-ic" :style="{ background: selected.color }">
          <span class="msi" style="color:#fff;font-size:34px">{{ selected.icon }}</span>
        </div>
        <h2>{{ selected.name }}</h2>
        <div class="small">{{ selected.cat }} · 0.1.0</div>
        <p>{{ selected.desc }}。这是 demo 状态,真实工作流会从 catalog.json 拉描述、版本、发布说明、截图等。</p>

        <button v-if="!selected.installed" class="pill-btn solid full" @click="install(selected)">
          <span class="msi sm">download</span><span>安装</span>
        </button>
        <button v-else class="pill-btn full">
          <span class="msi sm">check</span><span>已安装</span>
        </button>

        <dl>
          <dt>来源</dt><dd>iimos.ai/apps/catalog.json</dd>
          <dt>大小</dt><dd>~ 1.2 MB</dd>
          <dt>权限</dt><dd>读写 ~/.aios/{{ selected.id }}</dd>
          <dt>许可</dt><dd>MIT</dd>
        </dl>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 16px 24px 80px; max-width: 1200px; margin: 0 auto; width: 100%; }
.head { display: flex; align-items: baseline; gap: 12px; padding: 8px 0 16px; }
.head h1 { margin: 0; font-size: 22px; font-weight: 500; flex: 1; }
.head .dim { color: var(--text-2); font-size: 12.5px; }

.cats {
  display: flex; gap: 6px; flex-wrap: wrap;
  margin-bottom: 16px;
}
.cat {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--text-2);
  border-radius: 999px;
  font-size: 12.5px;
}
.cat:hover { color: var(--text); }
.cat.active {
  background: var(--accent-soft); color: var(--accent-fg);
  border-color: transparent;
  font-weight: 500;
}
.cat .ct { font-size: 11px; opacity: 0.8; }

.row { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
}
.tile {
  display: flex; gap: 14px;
  padding: 14px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color .15s, background .15s, box-shadow .15s;
}
.tile:hover { background: var(--bg-hover); box-shadow: var(--shadow-1); }
.tile.active { border-color: var(--accent); }
.tile .ic {
  width: 44px; height: 44px;
  display: grid; place-items: center;
  border-radius: 10px;
  flex: none;
}
.tile .body { min-width: 0; flex: 1; }
.tile .t { font-size: 14px; font-weight: 500; }
.tile .d { font-size: 12.5px; color: var(--text-2); margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.tile .meta { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.cat-chip {
  font-size: 11px; padding: 1px 8px;
  background: var(--bg-elev); color: var(--text-2);
  border-radius: 8px;
}
.installed {
  font-size: 11px; padding: 1px 8px;
  background: #e6f4ea; color: var(--good);
  border-radius: 8px; font-weight: 500;
}

.detail {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 20px;
  height: fit-content;
}
.big-ic {
  width: 56px; height: 56px;
  border-radius: 14px;
  display: grid; place-items: center;
  margin-bottom: 12px;
}
.detail h2 { margin: 0; font-size: 18px; font-weight: 500; }
.detail .small { color: var(--text-2); font-size: 12px; margin-top: 2px; }
.detail p { font-size: 13.5px; line-height: 1.6; color: var(--text); margin: 12px 0; }
.detail .full { width: 100%; justify-content: center; }
.detail dl {
  margin: 12px 0 0;
  display: grid; grid-template-columns: 80px 1fr;
  row-gap: 6px;
  font-size: 12.5px;
}
.detail dt { color: var(--text-2); }
.detail dd { margin: 0; word-break: break-all; }

@media (max-width: 980px) {
  .row { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .page { padding: 12px 12px 80px; }
}
</style>
