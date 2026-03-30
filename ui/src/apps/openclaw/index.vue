<template>
  <div class="flex h-full flex-col overflow-hidden font-['Georgia','PingFang_SC',serif] bg-[#2a1e14] relative">
    <div class="cork-bg absolute inset-0 z-0"></div>
    <div class="frame-t shrink-0 h-1.5 relative z-[5]"></div>

    <div class="flex-1 min-h-0 flex flex-col relative z-[2]">
      <!-- 顶栏 -->
      <div class="topbar-bg flex shrink-0 items-center gap-2.5 px-4 pt-2 pb-2 border-b border-[rgba(0,0,0,0.15)]">
        <div class="t-badge flex items-center justify-center w-[34px] h-[34px] rounded-full border-2 border-[#6a4a18] text-base">🦞</div>
        <div class="flex-1">
          <div class="text-sm font-bold text-[#3a2810]">OpenClaw</div>
          <div class="flex items-center gap-1 mt-px">
            <span class="w-1 h-1 rounded-full" :class="status.online ? (status.gateway ? 'dot-on' : 'dot-warn') : 'bg-[#6a4a3a]'"></span>
            <span class="text-[8px] text-[rgba(60,40,20,0.4)]">{{ status.online ? (status.gateway ? '__T_OPENCLAW_ONLINE__' : '__T_OPENCLAW_NO_GATEWAY__') : '__T_OPENCLAW_OFFLINE__' }}{{ status.version ? ' · ' + status.version : '' }}</span>
          </div>
        </div>
        <!-- Tab 切换 — 黄铜拨片开关 -->
        <div class="tab-track flex rounded-md overflow-hidden p-[2px]">
          <button v-for="tab in ['tasks', 'chat']" :key="tab" @click="activeTab = tab"
            class="tab-btn px-3.5 py-1 text-[9px] font-bold tracking-wider cursor-pointer font-['Georgia',serif]"
            :class="activeTab === tab ? 'tab-on' : 'tab-off'">{{ { tasks: '__T_OPENCLAW_TAB_TASKS__', chat: '__T_OPENCLAW_TAB_CHAT__' }[tab] }}</button>
        </div>
      </div>

      <!-- 内容区 -->
      <TaskView v-show="activeTab === 'tasks'" />
      <ChatView v-show="activeTab === 'chat'" />
    </div>

    <div class="frame-b shrink-0 h-1.5 relative z-[5]"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TaskView from './TaskView.vue';
import ChatView from './ChatView.vue';

const API = '/aios/apps/openclaw';

const status = ref({ online: false, version: null, gateway: false });
const activeTab = ref('tasks');

onMounted(async () => {
  try {
    const res = await fetch(`${API}/status`);
    status.value = await res.json();
  } catch { status.value = { online: false, version: null, gateway: false }; }
});
</script>

<style scoped>
/* 软木板纹理 */
.cork-bg {
  background:
    repeating-conic-gradient(rgba(160,120,70,0.03) 0% 25%, transparent 0% 50%) 0 0 / 18px 18px,
    repeating-linear-gradient(175deg, rgba(180,140,80,0.02) 0px, transparent 1px, transparent 4px),
    repeating-linear-gradient(85deg, rgba(120,80,40,0.02) 0px, transparent 1px, transparent 6px),
    linear-gradient(160deg, #8a6a42, #7a5c38, #6a4e30, #5a4228);
  box-shadow:inset 0 0 80px rgba(0,0,0,0.3);
}
.frame-t { background:linear-gradient(180deg,#4a3420,#3a2414); box-shadow:0 3px 6px rgba(0,0,0,0.4); }
.frame-b { background:linear-gradient(0deg,#4a3420,#3a2414); box-shadow:0 -3px 6px rgba(0,0,0,0.4); }
.topbar-bg { background:linear-gradient(180deg, rgba(60,42,24,0.6), rgba(50,35,20,0.3)); box-shadow:0 1px 0 rgba(255,220,150,0.04); }
.t-badge { background:radial-gradient(circle at 42% 38%, #c8a060, #8a6a30); box-shadow:inset 0 2px 3px rgba(255,220,150,0.3), 0 2px 4px rgba(0,0,0,0.4); }
.dot-on { background:radial-gradient(circle,#60b848,#388020); box-shadow:0 0 3px rgba(60,160,40,0.3); }
.dot-warn { background:radial-gradient(circle,#d4a840,#a08020); box-shadow:0 0 3px rgba(200,160,40,0.3); }
/* 拨片开关轨道 — 凹槽 */
.tab-track {
  background: linear-gradient(180deg, #2a1c10, #3a2818);
  border: 1px solid #1a0e04;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,220,150,0.06);
}
/* 选中态 — 凸起黄铜片 */
.tab-btn { transition: all 0.15s; position:relative; top:0; border-radius:4px; }
.tab-on {
  background: linear-gradient(180deg, #d8b868, #b89838, #a08028);
  color: #3a2008;
  border: 1px solid #8a6a20;
  box-shadow: 0 2px 0 rgba(60,30,0,0.4), inset 0 1px 1px rgba(255,255,200,0.35);
  text-shadow: 0 1px 0 rgba(255,230,160,0.3);
}
.tab-on:active { top:1px; box-shadow: 0 1px 0 rgba(60,30,0,0.3), inset 0 1px 2px rgba(0,0,0,0.2); }
/* 未选中态 — 沉在凹槽里 */
.tab-off {
  background: transparent;
  color: #6a5a38;
  border: 1px solid transparent;
  box-shadow: none;
  text-shadow: none;
}
.tab-off:hover { color: #a08850; }
</style>
