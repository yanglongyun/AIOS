<template>
  <div class="h-full overflow-y-auto bg-[#f5f0e8] bg-[repeating-linear-gradient(0deg,transparent_0,transparent_28px,rgba(0,0,0,0.02)_28px,rgba(0,0,0,0.02)_29px)] p-6 font-['Georgia','PingFang_SC',serif]">
    <div class="mx-auto max-w-[960px]">
      <div class="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 class="m-0 text-xl font-bold text-[#4a3a28]">{{ t('taskdetail_title') }}</h1>
          <p class="mt-0.5 text-xs text-[#a0907a]">{{ t('taskdetail_subtitle') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="task.status === 'pending'"
            type="button"
            class="cursor-pointer rounded-lg border border-[#c07060] bg-[#fdf3f2] px-3 py-1.5 text-xs font-semibold text-[#b04030] transition hover:bg-[#f8e2df] disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="stopping"
            @click="stopTask"
          >
            {{ stopping ? t('taskdetail_stopping') : t('taskdetail_stop_button') }}
          </button>
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-[#d4c8b8] bg-[#fffdf8] px-3 py-1.5 text-xs text-[#7a6a58] transition hover:bg-[#f6ecde]"
            @click="loadAll"
          >
            {{ t('taskdetail_refresh_button') }}
          </button>
        </div>
      </div>

      <div v-if="error" class="mb-4 rounded-xl border border-dashed border-[#e8b8a0] bg-[#fdf5f0] px-3 py-2 text-xs text-[#c06040]">
        {{ error }}
      </div>

      <div class="mb-4 rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <span class="rounded bg-[#f0e5d5] px-2 py-0.5 text-[11px] font-semibold text-[#7a6a58]">#{{ task.id || taskId }}</span>
          <span class="rounded bg-[#f0e5d5] px-2 py-0.5 text-[11px] font-semibold text-[#7a6a58]">{{ task.app || '-' }}</span>
          <span v-if="task.mode" class="rounded bg-[#e8f5e4] px-2 py-0.5 text-[11px] font-semibold text-[#4a8a38]">{{ task.mode }}</span>
          <span class="rounded px-2 py-0.5 text-[11px] font-semibold" :class="statusClass">{{ task.status || '-' }}</span>
        </div>
        <div class="mb-2 text-sm font-semibold text-[#4a3a28]">{{ task.title || t('taskdetail_unnamed_task') }}</div>
        <div class="grid gap-2 text-xs text-[#7a6a58] md:grid-cols-2">
          <div>{{ t('taskdetail_created_at') }}{{ task.created_at || '-' }}</div>
          <div>{{ t('taskdetail_finished_at') }}{{ task.finished_at || '-' }}</div>
          <div class="md:col-span-2 break-all">{{ t('taskdetail_conversation_id') }}{{ task.conversation_id || '-' }}</div>
        </div>
        <div class="mt-3 space-y-2">
          <div>
            <div class="mb-1 text-[11px] font-semibold text-[#a0907a]">{{ t('taskdetail_input_label') }}</div>
            <div class="whitespace-pre-wrap rounded-lg bg-[#f8f2e8] px-3 py-2 text-[13px] leading-relaxed text-[#4a3a28]">{{ task.prompt || '-' }}</div>
          </div>
          <div v-if="task.response">
            <div class="mb-1 text-[11px] font-semibold text-[#a0907a]">{{ t('taskdetail_output_label') }}</div>
            <div class="whitespace-pre-wrap rounded-lg bg-[#eef7ea] px-3 py-2 text-[13px] leading-relaxed text-[#2d4a30]">{{ task.response }}</div>
          </div>
          <div v-if="task.error">
            <div class="mb-1 text-[11px] font-semibold text-[#a0907a]">{{ t('taskdetail_error_label') }}</div>
            <div class="whitespace-pre-wrap rounded-lg bg-[#fdf0ef] px-3 py-2 text-[13px] leading-relaxed text-[#9a3a2a]">{{ task.error }}</div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-[#e8dcc8] bg-[#fffdf8] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="m-0 text-sm font-bold text-[#5a4a38]">{{ t('taskdetail_messages_title') }}</h2>
          <span class="text-[11px] text-[#a0907a]">{{ t('taskdetail_messages_count', { count: messages.length }) }}</span>
        </div>
        <div v-if="messages.length === 0" class="rounded-lg border border-dashed border-[#e8dcc8] py-6 text-center text-xs text-[#a0907a]">
          {{ t('taskdetail_no_messages') }}
        </div>
        <div v-else class="space-y-2">
          <div v-for="item in displayMessages" :key="item.id" class="rounded-lg border border-[#efe4d4] bg-[#fcfaf6] p-3">
            <div class="mb-1 flex items-center gap-2 text-[11px] text-[#8a7a68]">
              <span class="rounded bg-[#f0e5d5] px-1.5 py-0.5">#{{ item.id }}</span>
              <span>{{ item.message?.role || 'unknown' }}</span>
              <span v-if="item.message?.name">/{{ item.message.name }}</span>
              <span class="ml-auto">{{ item.createdAt || '' }}</span>
            </div>
            <div class="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-[#4a3a28]">{{ messageText(item) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { on } from '../ws.js';
import { useI18n } from '../i18n/index.js';
const route = useRoute();
const { t } = useI18n();
const taskId = Number(route.params.id || 0);
const task = ref({});
const messages = ref([]);
const error = ref('');
const stopping = ref(false);

const statusClass = computed(() => {
  const status = String(task.value.status || '');
  if (status === 'done') return 'bg-[#e8f5e4] text-[#4a8a38]';
  if (status === 'error' || status === 'aborted') return 'bg-[#fbe7e3] text-[#b04030]';
  return 'bg-[#f4ecd8] text-[#9a7a30]';
});

const displayMessages = computed(() => [...messages.value].reverse());

const request = async (url, options = {}) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
};

const messageText = (item) => {
  const msg = item?.message || {};
  if (typeof msg.content === 'string' && msg.content.trim()) return msg.content;
  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
    return msg.tool_calls.map((tc) => {
      const fn = tc?.function?.name || 'unknown';
      const args = tc?.function?.arguments || '{}';
      return `[tool_call] ${fn} ${args}`;
    }).join('\n');
  }
  return JSON.stringify(msg, null, 2);
};

const loadTask = async () => {
  const data = await request(`/api/task/detail?id=${taskId}`);
  task.value = data.task || {};
};

const loadMessages = async () => {
  const data = await request(`/api/task/messages?id=${taskId}`);
  messages.value = Array.isArray(data.messages) ? data.messages : [];
};

const loadAll = async () => {
  error.value = '';
  try {
    await Promise.all([loadTask(), loadMessages()]);
  } catch (e) {
    error.value = e.message || t('taskdetail_load_failed');
  }
};

const stopTask = async () => {
  if (stopping.value || task.value.status !== 'pending') return;
  stopping.value = true;
  error.value = '';
  try {
    await request('/api/task/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId })
    });
    await loadAll();
  } catch (e) {
    error.value = e.message || t('taskdetail_stop_failed');
  } finally {
    stopping.value = false;
  }
};

const unsubs = [];
onMounted(async () => {
  await loadAll();
  unsubs.push(on('tasks_changed', loadAll));
});

onUnmounted(() => {
  while (unsubs.length) {
    const off = unsubs.pop();
    if (typeof off === 'function') off();
  }
});
</script>
