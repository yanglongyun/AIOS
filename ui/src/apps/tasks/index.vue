<template>
  <div class="h-full overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] p-6 font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[960px]">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h1 class="m-0 text-xl font-bold text-[#4a3a28]">{{ t('tasks_center') }}</h1>
        <button type="button" class="cursor-pointer rounded-lg border border-[#d4c8b8] bg-[#fffdf8] px-3 py-1.5 text-xs text-[#7a6a58] transition hover:bg-[#f6ecde]" @click="loadAll">{{ t('tasks_refresh') }}</button>
      </div>

      <div v-if="error" class="mb-3 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-xs text-[#c06040]">{{ error }}</div>

      <div class="rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div v-if="allItems.length === 0" class="rounded-lg border border-dashed border-[#e8dcc8] py-8 text-center text-xs text-[#a0907a]">{{ t('tasks_empty_running') }}</div>
        <div v-else class="space-y-2">
          <component
            :is="item._type === 'task' ? 'button' : 'div'"
            v-for="item in allItems"
            :key="item._key"
            :type="item._type === 'task' ? 'button' : undefined"
            class="flex w-full items-start gap-2.5 rounded-lg border border-[#efe4d4] bg-[#fcfaf6] px-3 py-2.5 text-left transition"
            :class="item._type === 'task' ? 'cursor-pointer hover:bg-[#f8f1e7]' : ''"
            @click="item._type === 'task' && openTask(item.id)"
          >
            <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <span v-if="item._type === 'schedule'" class="text-[12px] text-[#8a6a40]">⏱</span>
              <span v-else-if="item.status === 'pending'" class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#c8a060]"></span>
              <span v-else-if="item.status === 'done'" class="text-sm text-[#7a9a6a]">✓</span>
              <span v-else class="text-sm text-[#c07060]">✗</span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="line-clamp-1 text-[12px] font-semibold leading-relaxed text-[#4a3a28]">
                {{ item._type === 'schedule' ? (item.name || t('tasks_unnamed')) : (item.title || t('tasks_unnamed')) }}
              </div>
              <div class="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#5a4a38]">
                {{ item._type === 'schedule' ? (item.prompt || '-') : (item.response || item.prompt || '-') }}
              </div>
              <div class="mt-1 flex items-center gap-2 text-[10px] text-[#8a7860]">
                <span v-if="item._type === 'schedule' && item.cron" class="rounded bg-[#eef0f8] px-1.5 py-0.5 font-mono text-[#5a6a8a]">{{ item.cron }}</span>
                <span v-if="item._type === 'schedule'" class="flex shrink-0 items-center gap-1.5">
                  <button type="button" class="cursor-pointer rounded border px-2 py-0.5 text-[10px] transition" :class="item.enabled ? 'border-[#c8d8c0] bg-[#f0f8ec] text-[#5a8a48] hover:bg-[#e0f0d8]' : 'border-[#e0d8c8] bg-[#f8f4ec] text-[#a09080] hover:bg-[#f0e8d8]'" @click.stop="toggleSchedule(item)">
                    {{ item.enabled ? t('tasks_enabled') : t('tasks_disabled') }}
                  </button>
                  <button type="button" class="cursor-pointer rounded border border-[#e8c8b8] bg-[#fdf5f0] px-2 py-0.5 text-[10px] text-[#c06040] transition hover:bg-[#f8e8e0]" @click.stop="removeSchedule(item.id)">{{ t('tasks_delete') }}</button>
                </span>
                <span v-if="item.app" class="rounded bg-[#f0e5d5] px-1.5 py-0.5 text-[#7a6a58]">{{ item.app }}</span>
                <span v-if="item._type === 'task'">{{ item.created_at || '' }}</span>
              </div>
            </div>
          </component>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { on } from '../../ws.ts';
import { useI18n } from '../../i18n/index.ts';
import { windowManager } from '../../stores/windowManager.ts';
import { chatPanel } from '../../stores/chatPanel.ts';
const { t } = useI18n();
const tasks = ref([]);
const schedules = ref([]);
const error = ref('');

const allItems = computed(() => {
  const items = [];
  for (const s of schedules.value) {
    items.push({ ...s, _type: 'schedule', _key: `s-${s.id}` });
  }
  for (const task of tasks.value) {
    items.push({ ...task, _type: 'task', _key: `t-${task.id}` });
  }
  return items;
});

const loadTasks = async () => {
  const res = await fetch('/aios/api/task?limit=200');
  const data = await res.json().catch(() => []);
  tasks.value = Array.isArray(data) ? data : [];
};

const loadSchedules = async () => {
  const res = await fetch('/aios/api/task/schedule?limit=200');
  const data = await res.json().catch(() => []);
  schedules.value = Array.isArray(data) ? data : [];
};

const loadAll = async () => {
  error.value = '';
  try {
    await Promise.all([loadTasks(), loadSchedules()]);
  } catch (e) {
    error.value = e.message || t('tasks_load_fail');
  }
};

const openTask = (id) => { if (id) windowManager.open('task-detail', { id }); };

const toggleSchedule = async (s) => {
  try {
    await fetch('/aios/api/task/schedule/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, enabled: s.enabled ? 0 : 1 })
    });
    await loadSchedules();
  } catch (e) {
    error.value = e.message || t('tasks_update_fail');
  }
};

const removeSchedule = async (id) => {
  try {
    await fetch('/aios/api/task/schedule/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadSchedules();
  } catch (e) {
    error.value = e.message || t('tasks_delete_fail');
  }
};

const unsubs = [];
onMounted(async () => {
  await loadAll();
  chatPanel.setContext({ scene: 'tasks', label: t('app_sidebar_tasks') });
  chatPanel.setQuickMessages([t('tasks_chat_quick_1'), t('tasks_chat_quick_2'), t('tasks_chat_quick_3')]);
  unsubs.push(on('tasks_changed', loadTasks));
  unsubs.push(on('schedules_changed', loadSchedules));
});
onUnmounted(() => {
  chatPanel.clearContext(); chatPanel.setQuickMessages([]);
  while (unsubs.length) {
    const off = unsubs.pop();
    if (typeof off === 'function') off();
  }
});
</script>
