<template>
  <div class="relative flex h-full flex-col overflow-hidden font-['Georgia','PingFang_SC',serif]" style="background:#2a1e14">
    <div class="cork-bg absolute inset-0 z-0"></div>
    <div class="frame-t relative z-[5] h-1.5 shrink-0"></div>

    <div class="relative z-[2] flex min-h-0 flex-1 flex-col">
      <!-- 顶栏 -->
      <div class="topbar-bg flex shrink-0 items-center gap-2.5 border-b border-[rgba(0,0,0,0.15)] px-4 pb-2 pt-2">
        <div class="t-badge flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-[#6a4a18] text-base">✅</div>
        <div class="flex-1">
          <div class="text-sm font-bold text-[#3a2810]">__T_TASKS_CENTER__</div>
          <div class="mt-px font-['Courier_New',monospace] text-[8px] text-[rgba(60,40,20,0.4)]">
            {{ schedules.length }} schedules · {{ tasks.length }} tasks
          </div>
        </div>
        <button class="tab-btn tab-off cursor-pointer rounded px-3.5 py-1 font-['Georgia',serif] text-[9px] font-bold tracking-wider" @click="loadAll">⟳ __T_TASKS_REFRESH__</button>
        <button class="tab-btn tab-on cursor-pointer rounded px-3.5 py-1 font-['Georgia',serif] text-[9px] font-bold tracking-wider" @click="windowManager.openWindow(taskCreateWindow)">+ __T_TASKS_CREATE_TITLE__</button>
      </div>

      <!-- 错误 -->
      <div v-if="error" class="mx-3 mt-2 shrink-0 rounded border border-[rgba(180,60,40,0.3)] bg-[rgba(180,60,40,0.1)] px-3 py-1.5 font-['Courier_New',monospace] text-[11px] text-[#c07060]">{{ error }}</div>

      <!-- 列表 -->
      <div class="min-h-0 flex-1 overflow-y-auto pb-8 scrollbar-hide">
        <div v-if="allItems.length === 0" class="py-12 text-center text-xs text-[rgba(255,230,180,0.25)]">__T_TASKS_EMPTY_RUNNING__</div>

        <template v-for="(item, idx) in allItems" :key="item._key">
          <!-- 定时任务 -->
          <div v-if="item._type === 'schedule'" class="hour-row major relative min-h-[52px] pl-[58px] pr-4">
            <div class="hour-label absolute -top-0.5 left-1.5 w-[42px] text-right font-['Courier_New',monospace] text-[12px] font-extrabold leading-none tracking-wide" style="color:rgba(180,230,150,0.7)">⏱</div>
            <div class="task-card relative my-2 cursor-pointer overflow-hidden rounded-sm" :class="'tilt-'+((idx%4)+1)">
              <div class="pin absolute -top-[3px] right-3 z-[3] h-4 w-4 rounded-full" :class="pinColor(idx)"></div>
              <div class="stripe absolute bottom-0 left-0 top-0 w-1" :class="stripeColor(idx)"></div>
              <div class="px-3 py-2.5 pl-3.5">
                <div class="flex items-center gap-2">
                  <span class="shrink-0 text-xl">{{ itemEmoji(idx) }}</span>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-bold text-[#3a2810]">{{ item.name || '__T_TASKS_UNNAMED__' }}</div>
                    <div class="mt-px font-['Courier_New',monospace] text-[9px] text-[#9a8a68]">
                      <span v-if="item.cron">cron: {{ item.cron }}</span>
                      <span v-else>schedule</span>
                    </div>
                  </div>
                  <div class="flex shrink-0 flex-col items-end gap-1" @click.stop>
                    <button class="tab-btn cursor-pointer rounded px-2 py-0.5 text-[8px] font-bold tracking-wider"
                      :class="item.enabled ? 'tab-on' : 'tab-off'"
                      @click="toggleSchedule(item)">{{ item.enabled ? '__T_TASKS_ENABLED__' : '__T_TASKS_DISABLED__' }}</button>
                    <button class="cursor-pointer rounded border border-[rgba(180,60,40,0.3)] bg-[rgba(180,60,40,0.15)] px-2 py-0.5 text-[8px] font-bold text-[#c07060] hover:bg-[rgba(180,60,40,0.25)]"
                      @click="removeSchedule(item.id)">__T_TASKS_DELETE__</button>
                  </div>
                </div>
                <div v-if="item.prompt" class="mt-1.5 line-clamp-2 text-[11px] italic leading-relaxed text-[#6a5838]">{{ item.prompt }}</div>
              </div>
            </div>
          </div>

          <!-- 普通任务 -->
          <div v-else class="hour-row relative min-h-[52px] pl-[58px] pr-4" :class="{ major: idx % 3 === 0 }">
            <div class="hour-label absolute -top-0.5 left-1.5 w-[42px] text-right font-['Courier_New',monospace] text-[11px] font-extrabold leading-none tracking-wide"
              :style="item.status === 'pending' ? 'color:rgba(255,200,120,0.85)' : item.status === 'done' ? 'color:rgba(100,200,80,0.7)' : 'color:rgba(200,80,60,0.7)'">
              {{ statusSymbol(item.status) }}
            </div>
            <div class="task-card relative my-2 cursor-pointer overflow-hidden rounded-sm"
              :class="['tilt-'+((idx%4)+1), item.status !== 'pending' ? 'opacity-60' : '']"
              @click="openTask(item.id)">
              <div class="pin absolute -top-[3px] right-3 z-[3] h-4 w-4 rounded-full" :class="pinColor(idx)"></div>
              <div class="stripe absolute bottom-0 left-0 top-0 w-1" :class="stripeColor(idx)"></div>
              <div v-if="idx % 5 === 0" class="tape absolute z-[4] h-3.5 w-[50px]" style="top:4px;left:-6px;transform:rotate(-10deg)"></div>
              <div class="px-3 py-2.5 pl-3.5">
                <div class="flex items-center gap-2">
                  <span class="shrink-0 text-xl">{{ itemEmoji(idx) }}</span>
                  <div class="min-w-0 flex-1">
                    <div class="truncate text-sm font-bold text-[#3a2810]">{{ item.title || '__T_TASKS_UNNAMED__' }}</div>
                    <div class="mt-px font-['Courier_New',monospace] text-[9px] text-[#9a8a68]">
                      {{ item.created_at || '' }}<span v-if="item.app"> · {{ item.app }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="item.response || item.prompt" class="mt-1.5 line-clamp-2 text-[11px] italic leading-relaxed text-[#6a5838]">{{ item.response || item.prompt }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="frame-b relative z-[5] h-1.5 shrink-0"></div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { on } from '../../system/ws.js';
import { windowManager } from '../../system/windows.js';
import { taskCreateWindow, taskDetailWindow } from './intent.js';

const tasks = ref([]);
const schedules = ref([]);
const error = ref('');

const EMOJIS = ['🐡','🐠','🐙','🪼','🦑','🐚','🦀','🐳'];
const PINS = ['pin-r','pin-g','pin-b','pin-y'];
const STRIPES = ['s-coral','s-teal','s-plum','s-amber'];
const itemEmoji = (idx) => EMOJIS[idx % EMOJIS.length];
const pinColor = (idx) => PINS[idx % PINS.length];
const stripeColor = (idx) => STRIPES[idx % STRIPES.length];
const statusSymbol = (s) => s === 'pending' ? '▶' : s === 'done' ? '✓' : '✗';

const allItems = computed(() => {
  const items = [];
  for (const s of schedules.value) items.push({ ...s, _type: 'schedule', _key: `s-${s.id}` });
  for (const t of tasks.value) items.push({ ...t, _type: 'task', _key: `t-${t.id}` });
  return items;
});

const loadTasks = async () => {
  const res = await fetch('/api/task?limit=200');
  const data = await res.json().catch(() => []);
  tasks.value = Array.isArray(data) ? data : [];
};
const loadSchedules = async () => {
  const res = await fetch('/api/task/schedule?limit=200');
  const data = await res.json().catch(() => []);
  schedules.value = Array.isArray(data) ? data : [];
};
const loadAll = async () => {
  error.value = '';
  try { await Promise.all([loadTasks(), loadSchedules()]); }
  catch (e) { error.value = e.message || '__T_TASKS_LOAD_FAIL__'; }
};

const openTask = (id) => { if (id) windowManager.openWindow(taskDetailWindow, { id }); };

const toggleSchedule = async (s) => {
  try {
    await fetch('/api/task/schedule/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, enabled: s.enabled ? 0 : 1 }) });
    await loadSchedules();
  } catch (e) { error.value = e.message; }
};
const removeSchedule = async (id) => {
  try {
    await fetch('/api/task/schedule/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    await loadSchedules();
  } catch (e) { error.value = e.message; }
};

const unsubs = [];
onMounted(async () => {
  await loadAll();
  unsubs.push(on('tasks_changed', loadTasks));
  unsubs.push(on('schedules_changed', loadSchedules));
});
onUnmounted(() => { while (unsubs.length) { const off = unsubs.pop(); if (typeof off === 'function') off(); } });
</script>

<style scoped>
.cork-bg {
  background:
    repeating-conic-gradient(rgba(160,120,70,0.03) 0% 25%, transparent 0% 50%) 0 0 / 18px 18px,
    repeating-linear-gradient(175deg, rgba(180,140,80,0.02) 0px, transparent 1px, transparent 4px),
    repeating-linear-gradient(85deg, rgba(120,80,40,0.02) 0px, transparent 1px, transparent 6px),
    linear-gradient(160deg, #8a6a42, #7a5c38, #6a4e30, #5a4228);
  box-shadow: inset 0 0 80px rgba(0,0,0,0.3);
}
.frame-t { background:linear-gradient(180deg,#4a3420,#3a2414); box-shadow:0 3px 6px rgba(0,0,0,0.4); }
.frame-b { background:linear-gradient(0deg,#4a3420,#3a2414); box-shadow:0 -3px 6px rgba(0,0,0,0.4); }
.topbar-bg { background:linear-gradient(180deg,rgba(60,42,24,0.6),rgba(50,35,20,0.3)); box-shadow:0 1px 0 rgba(255,220,150,0.04); }
.t-badge { background:radial-gradient(circle at 42% 38%,#c8a060,#8a6a30); box-shadow:inset 0 2px 3px rgba(255,220,150,0.3),0 2px 4px rgba(0,0,0,0.4); }
.tab-btn { transition:all 0.15s; position:relative; top:0; }
.tab-on { background:linear-gradient(180deg,#d8b868,#b89838,#a08028); color:#3a2008; border:1px solid #8a6a20; box-shadow:0 2px 0 rgba(60,30,0,0.4),inset 0 1px 1px rgba(255,255,200,0.35); text-shadow:0 1px 0 rgba(255,230,160,0.3); }
.tab-on:active { top:1px; box-shadow:0 1px 0 rgba(60,30,0,0.3),inset 0 1px 2px rgba(0,0,0,0.2); }
.tab-off { background:transparent; color:#6a5a38; border:1px solid transparent; }
.tab-off:hover { color:#a08850; }
.hour-row::before { content:''; position:absolute; top:0; left:52px; right:0; height:1px; background:linear-gradient(90deg,rgba(200,180,140,0.12),rgba(200,180,140,0.03)); }
.hour-row.major::before { background:linear-gradient(90deg,rgba(200,180,140,0.22),rgba(200,180,140,0.05)); }
.hour-label { text-shadow:0 1px 2px rgba(0,0,0,0.3); }
.task-card { background:linear-gradient(180deg,#faf4e4,#f4ecda,#f0e6d0); box-shadow:1px 2px 4px rgba(0,0,0,0.18),2px 3px 6px rgba(0,0,0,0.08),inset 0 0 20px rgba(200,180,140,0.12); transition:transform 0.1s; }
.task-card:active { transform:scale(0.98) rotate(0deg) !important; }
.tilt-1{transform:rotate(-0.5deg)} .tilt-2{transform:rotate(0.4deg)} .tilt-3{transform:rotate(-0.3deg)} .tilt-4{transform:rotate(0.6deg)}
.pin { box-shadow:0 2px 3px rgba(0,0,0,0.3); }
.pin::after { content:''; position:absolute; top:3px; left:4px; width:4px; height:3px; border-radius:50%; background:rgba(255,255,255,0.35); }
.pin-r{background:radial-gradient(circle at 38% 32%,#ff8888,#c83030);border:1px solid #a02020}
.pin-g{background:radial-gradient(circle at 38% 32%,#88dd88,#30a030);border:1px solid #208020}
.pin-b{background:radial-gradient(circle at 38% 32%,#88aaff,#3050c8);border:1px solid #2040a0}
.pin-y{background:radial-gradient(circle at 38% 32%,#ffdd66,#c8a020);border:1px solid #a08010}
.s-coral{background:linear-gradient(180deg,#e06848,#c04830)} .s-teal{background:linear-gradient(180deg,#48a8a0,#308880)}
.s-plum{background:linear-gradient(180deg,#9068a8,#704888)} .s-amber{background:linear-gradient(180deg,#d0a040,#b08020)}
.tape { background:linear-gradient(180deg,rgba(255,240,180,0.65),rgba(230,210,140,0.45)); border:1px solid rgba(200,180,120,0.25); }
.scrollbar-hide::-webkit-scrollbar { display:none; }
</style>
