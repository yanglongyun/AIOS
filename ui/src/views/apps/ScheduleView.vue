<template>
  <div class="h-full overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] p-6 font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[780px]">

      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">⏰</span>
          <div>
            <h1 class="text-xl font-bold text-[#3a2e20]">定时任务</h1>
            <p class="text-xs text-[#9a8a74]">
              共 {{ schedules.length }} 个任务，{{ schedules.filter(s => s.enabled).length }} 个启用中
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-[#d8cebb] bg-white px-3 py-1.5 text-xs text-[#7a6a54] hover:bg-[#f0e8d8] transition"
            @click="loadSchedules"
          >
            刷新
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-xl bg-[#4a3520] px-4 py-2 text-sm font-semibold text-[#f0e4cc] shadow-sm hover:bg-[#5a4530] transition"
            @click="router.push('/schedule/create')"
          >
            <span class="text-base leading-none">+</span> 新建任务
          </button>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-4 py-2.5 text-xs text-[#c06040]">
        {{ error }}
      </div>

      <!-- Empty -->
      <div v-if="schedules.length === 0" class="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div class="text-5xl opacity-30">⏰</div>
        <p class="text-sm text-[#9a8a74]">暂无定时任务</p>
        <button
          type="button"
          class="mt-1 rounded-xl bg-[#4a3520] px-5 py-2 text-sm font-semibold text-[#f0e4cc] hover:bg-[#5a4530] transition"
          @click="router.push('/schedule/create')"
        >
          新建任务
        </button>
      </div>

      <!-- List -->
      <div v-else class="space-y-3">
        <div
          v-for="s in schedules"
          :key="s.id"
          class="rounded-2xl border border-[#e4d8c4] shadow-sm transition-shadow hover:shadow-md"
          :class="s.enabled ? 'bg-white' : 'bg-[#faf8f4] opacity-70 hover:opacity-90'"
        >
          <div class="flex items-start gap-4 p-4">
            <!-- 类型图标 -->
            <div
              class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
              :class="[s.cron ? 'bg-[#e8f0e0]' : 'bg-[#eef0f8]', s.enabled ? '' : 'grayscale']"
            >
              {{ s.cron ? '🔄' : '📅' }}
            </div>

            <!-- 主体 -->
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-[#3a2e20]">{{ s.name }}</span>
                    <span
                      v-if="!s.enabled"
                      class="rounded-full bg-[#f0ece4] px-2 py-0.5 text-[10px] font-medium text-[#9a8a74]"
                    >已停用</span>
                    <span
                      v-else-if="s.cron"
                      class="rounded-full bg-[#e8f0e0] px-2 py-0.5 text-[10px] font-medium text-[#4a7a38]"
                    >循环</span>
                    <span
                      v-else
                      class="rounded-full bg-[#eef0f8] px-2 py-0.5 text-[10px] font-medium text-[#4a5a8a]"
                    >定时</span>
                  </div>
                  <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-[#8a7a64]">{{ s.prompt }}</p>
                </div>
                <!-- Toggle -->
                <button
                  type="button"
                  class="relative mt-0.5 h-[18px] w-8 shrink-0 rounded-full transition-colors duration-200"
                  :class="s.enabled ? 'bg-[#6a9c58]' : 'bg-[#d1c9bb]'"
                  @click="toggleSchedule(s)"
                >
                  <span
                    class="absolute top-[3px] h-3 w-3 rounded-full bg-white shadow transition-all duration-200"
                    :class="s.enabled ? 'left-[17px]' : 'left-[3px]'"
                  />
                </button>
              </div>

              <!-- 元信息 -->
              <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#9a8a74]">
                <span v-if="s.cron" class="flex items-center gap-1">
                  <span>🕗</span>
                  <span class="font-mono text-[#5a6a8a]">{{ s.cron }}</span>
                </span>
                <span v-if="s.run_at" class="flex items-center gap-1">
                  <span>📆</span> {{ s.run_at.slice(0, 16) }}
                </span>
                <span v-if="s.last_run_at" class="flex items-center gap-1">
                  <span>✅</span> 上次运行：{{ s.last_run_at.slice(0, 16) }}
                </span>
                <span v-if="s.creator && s.creator !== 'user'" class="rounded bg-[#f8f0e0] px-1.5 py-0.5 text-[#9a7a40]">{{ s.creator }}</span>
              </div>
            </div>
          </div>

          <!-- 操作栏 -->
          <div class="flex items-center justify-between border-t border-[#f0e8d8] px-4 py-2">
            <button
              v-if="s.last_task_id"
              type="button"
              class="text-[11px] text-[#7a6a54] underline-offset-2 hover:underline hover:text-[#4a3a28] transition"
              @click="openTask(s.last_task_id)"
            >
              查看上次记录 #{{ s.last_task_id }}
            </button>
            <span v-else class="text-[11px] text-[#b0a08a]">尚未运行</span>
            <div class="flex gap-4">
              <button
                type="button"
                class="text-[11px] text-[#7a6a54] hover:text-[#4a3a28] transition"
                @click="editSchedule(s.id)"
              >编辑</button>
              <button
                type="button"
                class="text-[11px] text-[#c06040] hover:text-[#9a3020] transition"
                @click="removeSchedule(s.id)"
              >删除</button>
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

const openTask = (id) => { if (id) router.push(`/task/${id}`); };
const editSchedule = (id) => { if (id) router.push(`/schedule/edit/${id}`); };

const toggleSchedule = async (s) => {
  try {
    await fetch('/api/schedule/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, enabled: s.enabled ? 0 : 1 })
    });
    await loadSchedules();
  } catch (e) {
    error.value = e.message;
  }
};

const removeSchedule = async (id) => {
  try {
    await fetch('/api/schedule/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadSchedules();
  } catch (e) {
    error.value = e.message;
  }
};

const unsubs = [];
onMounted(async () => {
  await loadSchedules();
  unsubs.push(on('schedules_changed', loadSchedules));
});
onUnmounted(() => {
  while (unsubs.length) {
    const off = unsubs.pop();
    if (typeof off === 'function') off();
  }
});
</script>
