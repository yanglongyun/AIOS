<template>
  <div class="h-full flex justify-center bg-[#c8bcac] bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_2px,transparent_2px,transparent_8px)] p-4 font-['PingFang_SC','Microsoft_YaHei',sans-serif] text-[#3e3223]">
    <div class="w-full max-w-[480px] h-full flex flex-col rounded-2xl border border-[#ddd6ce] bg-[#eeebe6] p-5 relative shadow-[inset_0_4px_6px_rgba(255,255,255,0.9),inset_0_-4px_6px_rgba(0,0,0,0.06),0_20px_40px_rgba(80,60,40,0.25),0_6px_12px_rgba(80,60,40,0.12)]">

      <!-- 顶栏 -->
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-[#3e3223] flex items-center justify-center text-xl border-2 border-[#1e180f] shadow-[inset_2px_2px_4px_rgba(255,255,255,0.15),0_3px_6px_rgba(0,0,0,0.3)]">⏱</div>
          <div>
            <h1 class="text-lg font-black text-[#3e3223] tracking-widest">定时调度器</h1>
            <p class="text-[10px] text-[#8a7f72] font-bold uppercase tracking-wider">AIOS TASK SCHEDULER</p>
          </div>
        </div>
        <button class="action-btn px-3 py-2 text-[11px] tracking-wider flex items-center gap-1" @click="router.push('/schedule/create')">
          <span class="text-base leading-none font-black">+</span> 安排任务
        </button>
      </div>

      <!-- 错误 -->
      <div v-if="error" class="mb-3 rounded bg-[#fdf5f0] border border-dashed border-[#e8b8a0] px-3 py-2 text-xs text-[#c06040]">{{ error }}</div>

      <!-- 空状态 -->
      <div v-if="!schedules.length" class="flex-1 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-[#b8ad9e] bg-[#e0d8cf] p-3 shadow-[inset_0_4px_8px_rgba(0,0,0,0.12),0_2px_0_rgba(255,255,255,0.8)]">
        <div class="text-4xl opacity-30">⏱</div>
        <p class="text-[11px] text-[#8a7f72] font-bold">暂无定时任务</p>
      </div>

      <!-- 列表 -->
      <div v-else class="flex-1 overflow-y-auto space-y-3 rounded-lg border-2 border-[#b8ad9e] bg-[#e0d8cf] p-3 shadow-[inset_0_4px_8px_rgba(0,0,0,0.12),0_2px_0_rgba(255,255,255,0.8)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          v-for="s in schedules" :key="s.id"
          class="punch-card relative overflow-hidden rounded-md border border-[#d4c8b4] bg-[#faf7f2] p-3 pt-4 shadow-[0_2px_4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]"
          :class="{ 'bg-[#f0ece4] opacity-65': !s.enabled }"
        >
          <div class="flex items-start gap-3">
            <div class="flex flex-col items-center gap-1 mt-0.5">
              <button
                class="rocker-switch flex items-center justify-center"
                :class="s.enabled ? 'rocker-on' : 'rocker-off'"
                @click="toggleSchedule(s)"
              >{{ s.enabled ? '开' : '关' }}</button>
            </div>
            <div class="flex-1 min-w-0 cursor-pointer" @click="router.push(`/schedule/logs/${s.id}`)">
              <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                <span class="font-black text-sm" :class="s.enabled ? 'text-[#3e3223]' : 'text-[#7a6f62]'">{{ s.name }}</span>
                <span v-if="!s.enabled" class="bg-[#e8e0d4] text-[#8a7f72] text-[9px] font-black px-1.5 py-0.5 rounded border border-[#d0c8bc]">已停用</span>
                <span v-else-if="s.cron" class="bg-[#dcecd6] text-[#2a5a30] text-[9px] font-black px-1.5 py-0.5 rounded border border-[#b8d8b0]">循环</span>
                <span v-else class="bg-[#dde0f0] text-[#2a3070] text-[9px] font-black px-1.5 py-0.5 rounded border border-[#b8bce0]">定时</span>
              </div>
              <p class="text-[11px] leading-relaxed line-clamp-2" :class="s.enabled ? 'text-[#7a6f62]' : 'text-[#9a9080]'">{{ s.prompt }}</p>
              <div class="flex items-center gap-3 mt-2 flex-wrap">
                <span v-if="s.cron" class="font-['Courier_New',monospace] rounded-[3px] border border-[#5a5040] bg-[#3b3631] px-1.5 py-px text-[10px] font-bold text-[#d4c88a] shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]" :style="{ opacity: s.enabled ? 1 : 0.6 }">{{ s.cron }}</span>
                <span v-if="s.run_at" class="text-[10px] text-[#7a6f62] font-bold">📆 {{ s.run_at.slice(0, 16) }}</span>
                <span v-if="s.last_run_at" class="text-[10px] font-bold" :class="s.enabled ? 'text-[#8a7f72]' : 'text-[#a09080]'">✓ 上次：{{ formatTime(s.last_run_at) }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-[#d4c8b4]">
            <button
              v-if="s.last_task_id"
              class="text-[10px] font-bold underline decoration-dashed hover:text-[#3e3223]"
              :class="s.enabled ? 'text-[#7a6f62]' : 'text-[#9a9080]'"
              @click="router.push(`/task/${s.last_task_id}`)"
            >查看上次记录 #{{ s.last_task_id }}</button>
            <span v-else class="text-[10px] font-bold text-[#a09080]">尚未运行</span>
            <div class="flex gap-3">
              <button class="text-[10px] font-bold text-[#7a6f62] hover:text-[#3e3223]" @click="router.push(`/schedule/edit/${s.id}`)">编辑</button>
              <button class="text-[10px] font-bold text-[#c04040] hover:text-[#8a2020]" @click="removeSchedule(s.id)">删除</button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { on } from '../../ws.js';

const router = useRouter();
const schedules = ref([]);
const error = ref('');

const loadSchedules = async () => {
  error.value = '';
  try {
    const res = await fetch('/api/schedule');
    const data = await res.json().catch(() => []);
    schedules.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e.message || '加载失败';
  }
};

const toggleSchedule = async (s) => {
  try {
    await fetch('/api/schedule/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, enabled: s.enabled ? 0 : 1 })
    });
    await loadSchedules();
  } catch (e) { error.value = e.message; }
};

const removeSchedule = async (id) => {
  try {
    await fetch('/api/schedule/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadSchedules();
  } catch (e) { error.value = e.message; }
};

const formatTime = (t) => {
  if (!t) return '';
  const d = new Date(t.replace(' ', 'T'));
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && d.getDate() === now.getDate()) return `今天 ${t.slice(11, 16)}`;
  if (diff < 172800000) return `昨天 ${t.slice(11, 16)}`;
  return t.slice(5, 16);
};

const unsubs = [];
onMounted(async () => {
  await loadSchedules();
  unsubs.push(on('schedules_changed', loadSchedules));
});
onUnmounted(() => { while (unsubs.length) { const off = unsubs.pop(); if (typeof off === 'function') off(); } });
</script>

<style scoped>
/* 打孔卡顶部锯齿 - 伪元素只能用原生 CSS */
.punch-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: repeating-linear-gradient(90deg, #c8b898 0px, #c8b898 4px, transparent 4px, transparent 8px);
}
/* 3D 拨动开关 - 多层 box-shadow + active 状态 */
.rocker-switch {
  width: 44px; height: 24px; border-radius: 4px;
  font-weight: 900; font-size: 9px; cursor: pointer; flex-shrink: 0; transition: all 0.1s;
}
.rocker-on {
  background-color: #5c8f6b; border: 2px solid #2a4f35; color: #d0e8d5;
  box-shadow: inset 0 3px 0 rgba(255,255,255,0.25), inset 0 -3px 0 rgba(0,0,0,0.2), 0 3px 0 #2a4f35, 0 5px 5px rgba(0,0,0,0.25);
}
.rocker-off {
  background-color: #a09888; border: 2px solid #5a524a; color: #d8d0c4;
  box-shadow: inset 0 3px 0 rgba(255,255,255,0.2), inset 0 -3px 0 rgba(0,0,0,0.15), 0 3px 0 #5a524a, 0 5px 5px rgba(0,0,0,0.2);
}
.rocker-switch:active { transform: translateY(3px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0, 0 1px 2px rgba(0,0,0,0.2) !important; }
/* 3D 按钮 - gradient + text-shadow + active 下沉 */
.action-btn {
  background: linear-gradient(180deg, #d05a38 0%, #a83c20 100%);
  border: 2px solid #7a2810; border-radius: 8px; color: #fdf0e8;
  font-weight: 900; cursor: pointer; letter-spacing: 0.1em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4); transition: all 0.1s;
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.2), 0 5px 0 #6a1e08, 0 7px 10px rgba(0,0,0,0.3);
}
.action-btn:active { transform: translateY(5px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 #6a1e08, 0 2px 4px rgba(0,0,0,0.3); }
</style>
