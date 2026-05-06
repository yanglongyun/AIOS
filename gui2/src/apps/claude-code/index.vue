<script setup>
import { ref } from 'vue';
import { useViewStore } from '@/stores/view.js';

const view = useViewStore();

const sessions = ref([
  { id: 1, title: '重构 cache 模块', cwd: '~/projects/meem-aios', when: '今天 14:08', running: true },
  { id: 2, title: '加 sysinfo app',  cwd: '~/projects/meem-aios', when: '今天 11:42' },
  { id: 3, title: '修 nginx 反代 bug', cwd: '~/srv/edge',          when: '昨天 19:00' }
]);
const active = ref(1);
const events = ref([
  { kind: 'user', text: '帮我把 cache 抽出来,改成可插拔接口 + LRU 默认实现' },
  { kind: 'assistant', text: '我先看一下现有 cache 用法,再列计划。' },
  { kind: 'tool', name: 'grep', args: '"cache" -r src/', result: 'src/cache.js · 142 行\nsrc/api/list.js:8\nsrc/repository/messages.js:12' },
  { kind: 'tool', name: 'read_file', args: 'src/cache.js' },
  { kind: 'assistant', text: '现有实现是单文件 in-memory,容量没限制。计划:\n1. 抽 ICache 接口\n2. 加 LRUCache(maxSize)\n3. 工厂方法 + 单元测试\n要继续吗?' },
  { kind: 'user', text: '继续' },
  { kind: 'tool', name: 'edit_file', args: 'src/cache.js (重写)', running: true }
]);
const expanded = ref(new Set([2, 3]));
const toggle = (i) => expanded.value.has(i) ? expanded.value.delete(i) : expanded.value.add(i);
function pick(id) {
  active.value = id;
  if (window.innerWidth < 720) view.closeAppDrawer();
}
</script>

<template>
  <aside class="app-side" :class="{ collapsed: !view.appDrawerOpen }">
    <div class="app-side-inner">
      <header class="head">
        <span class="title">Claude Code</span>
        <button class="icon-btn" title="新会话"><span class="msi sm">add</span></button>
      </header>
      <div class="list">
        <div v-for="s in sessions" :key="s.id"
          class="s"
          :class="{ active: s.id === active }"
          @click="pick(s.id)">
          <div class="t">
            <span v-if="s.running" class="dot" title="运行中"></span>
            <span class="name">{{ s.title }}</span>
          </div>
          <div class="meta">{{ s.cwd }} · {{ s.when }}</div>
        </div>
      </div>
    </div>
  </aside>

  <section class="pane">
    <header class="phead">
      <div>
        <div class="phead-title">重构 cache 模块</div>
        <div class="phead-sub">cwd: ~/projects/meem-aios · default permission</div>
      </div>
      <button class="pill-btn"><span class="msi sm">stop_circle</span><span>停止</span></button>
      <button class="icon-btn"><span class="msi sm">more_vert</span></button>
    </header>

    <div class="events">
      <div v-for="(e, i) in events" :key="i" class="event" :class="e.kind">
        <div v-if="e.kind === 'user'" class="bubble user">{{ e.text }}</div>
        <div v-else-if="e.kind === 'assistant'" class="bubble assistant">{{ e.text }}</div>
        <div v-else class="tool">
          <button class="tool-head" @click="toggle(i)">
            <span class="msi sm">{{ e.running ? 'progress_activity' : 'check_circle' }}</span>
            <code>{{ e.name }}</code>
            <span class="dim">{{ e.args }}</span>
            <span v-if="e.running" class="badge">运行中</span>
            <span class="msi xs ex">{{ expanded.has(i) ? 'expand_less' : 'expand_more' }}</span>
          </button>
          <pre v-if="e.result && expanded.has(i)" class="tool-result">{{ e.result }}</pre>
        </div>
      </div>
    </div>

    <div class="composer">
      <textarea rows="1" placeholder="继续指令..." />
      <div class="acts">
        <select class="perm">
          <option>default</option>
          <option>plan</option>
          <option>auto</option>
          <option>acceptEdits</option>
        </select>
        <button class="pill-btn solid">
          <span class="msi sm">send</span>
          <span>发送</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.head {
  display: flex; align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line-soft);
}
.head .title { flex: 1; font-size: 16px; font-weight: 500; }
.list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px; }
.s { padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: background .12s; }
.s:hover { background: var(--bg-hover); }
.s.active { background: var(--accent-soft); }
.s .t { display: flex; align-items: center; gap: 6px; }
.s .name { font-size: 13.5px; font-weight: 500; }
.s .meta { font-size: 11.5px; color: var(--text-2); margin-top: 2px; }
.s.active .meta { color: var(--accent-fg); }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--good); }

.pane { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.phead {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--line-soft);
}
.phead-title { font-size: 16px; font-weight: 500; }
.phead-sub { font-size: 12px; color: var(--text-2); margin-top: 2px; }

.events {
  flex: 1; min-height: 0;
  overflow-y: auto;
  padding: 24px;
  max-width: 840px;
  margin: 0 auto;
  width: 100%;
  display: flex; flex-direction: column; gap: 12px;
}
.event { display: flex; flex-direction: column; }
.event.user { align-items: flex-end; }
.event.assistant, .event.tool { align-items: flex-start; }
.bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 14px; line-height: 1.55;
  white-space: pre-wrap;
}
.bubble.user { background: var(--accent); color: #fff; border-top-right-radius: 4px; }
.bubble.assistant { background: var(--bg-elev); border-top-left-radius: 4px; }

.tool {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--bg-card);
}
.tool-head {
  display: flex; align-items: center; gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: 0; background: transparent;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
}
.tool-head:hover { background: var(--bg-hover); border-radius: 8px; }
.tool-head code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  background: var(--bg-elev);
  padding: 2px 6px;
  border-radius: 4px;
}
.tool-head .dim { color: var(--text-2); font-size: 12px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tool-head .badge {
  background: var(--accent-soft); color: var(--accent-fg);
  font-size: 10.5px; padding: 1px 7px; border-radius: 10px;
}
.tool-head .ex { color: var(--text-3); }
.tool-result {
  margin: 0;
  padding: 10px 14px;
  background: #fafafa;
  border-top: 1px solid var(--line-soft);
  border-radius: 0 0 8px 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-2);
  overflow-x: auto;
  white-space: pre;
}

.composer {
  flex: none;
  padding: 12px 24px 16px;
  max-width: 840px; margin: 0 auto; width: 100%;
}
.composer textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  outline: 0;
  resize: none;
}
.composer textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.composer .acts { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
.perm {
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 4px 12px;
  background: var(--bg);
  font-size: 12.5px;
  color: var(--text);
  outline: 0;
}

@media (max-width: 720px) {
  .events { padding: 16px 12px; }
  .composer { padding: 8px 12px 12px; }
}
</style>
