<script setup>
import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
import { abortTask, getTask, listSubscriptions, listTasks } from '../lib/api.js';
import { t } from '../lib/locale.js';

const setPageNav = inject('pageNav');

const tasks = ref([]);
const subscriptions = ref([]);
const currentTaskId = ref(null);
const currentTask = ref(null);
const taskMessages = ref([]);
const loading = ref(false);
const error = ref('');
const stopping = ref(false);
let timer = null;

const statusText = (status) => ({
  pending: 'Pending',
  running: 'Running',
  done: 'Done',
  error: 'Error',
  aborted: 'Aborted',
}[status] || status || '-');

const isActive = (task) => ['pending', 'running'].includes(task?.status);
const visibleTask = computed(() => currentTask.value || tasks.value.find((task) => task.id === currentTaskId.value) || null);
const subscriptionsByTask = computed(() => {
  const map = new Map();
  for (const item of subscriptions.value) {
    const key = Number(item.task_id);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
});
const visibleSubscriptions = computed(() => subscriptionsByTask.value.get(Number(currentTaskId.value)) || []);

function setListNav() {
  setPageNav(t('nav_tasks', 'Tasks'), null, null, null);
}

function closeDetail() {
  currentTaskId.value = null;
  currentTask.value = null;
  taskMessages.value = [];
  setListNav();
}

function setDetailNav(task) {
  setPageNav(task?.title || task?.name || t('nav_task', 'Task'), null, null, null);
}

async function loadTasks() {
  loading.value = true;
  error.value = '';
  try {
    const [data, subscriptionData] = await Promise.all([
      listTasks(200),
      listSubscriptions(500),
    ]);
    tasks.value = data.tasks || [];
    subscriptions.value = subscriptionData.subscriptions || [];
  } catch (err) {
    error.value = err.message || t('common_load_failed', 'Load failed');
  } finally {
    loading.value = false;
  }
}

async function loadTask(id) {
  if (!id) return;
  error.value = '';
  try {
    const data = await getTask(id);
    currentTask.value = data.task || null;
    taskMessages.value = Array.isArray(data.messages) ? data.messages : [];
    setDetailNav(currentTask.value);
  } catch (err) {
    error.value = err.message || 'Load failed';
  }
}

async function openTask(task) {
  currentTaskId.value = task.id;
  currentTask.value = task;
  setDetailNav(task);
  await loadTask(task.id);
}

async function stopTask() {
  const task = visibleTask.value;
  if (!task || !isActive(task) || stopping.value) return;
  stopping.value = true;
  error.value = '';
  try {
    const data = await abortTask(task.id);
    currentTask.value = data.task || task;
    await loadTasks();
  } catch (err) {
    error.value = err.message || 'Abort failed';
  } finally {
    stopping.value = false;
  }
}

function formatTime(value) {
  if (!value) return '-';
  return String(value).replace('T', ' ').slice(0, 19);
}

function taskSubscriptionText(taskId) {
  const items = subscriptionsByTask.value.get(Number(taskId)) || [];
  if (!items.length) return '';
  const active = items.filter((item) => item.status === 'active').length;
  const fired = items.filter((item) => item.status === 'fired' || item.fired_at).length;
  return `通知 ${items.length}${active ? ` · 活跃 ${active}` : ''}${fired ? ` · 已触发 ${fired}` : ''}`;
}

function messageRole(row) {
  const role = row?.message?.role || 'unknown';
  const source = row?.meta?.source || '';
  return source ? `${role} · ${source}` : role;
}

function messageText(row) {
  const msg = row?.message || {};
  if (typeof msg.content === 'string' && msg.content) return msg.content;
  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length) {
    return msg.tool_calls.map((call) => {
      const name = call?.function?.name || 'tool';
      const args = call?.function?.arguments || '{}';
      return `${name} ${args}`;
    }).join('\n');
  }
  return JSON.stringify(msg, null, 2);
}

function startPolling() {
  timer = setInterval(async () => {
    await loadTasks();
    if (currentTaskId.value) await loadTask(currentTaskId.value);
  }, 2500);
}

onMounted(async () => {
  setListNav();
  await loadTasks();
  startPolling();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <section class="h-full overflow-y-auto px-6 pb-7 pt-[18px]">
    <div v-if="!currentTaskId" class="mx-auto max-w-[780px]">
      <p class="mb-3 max-w-[640px] text-[12px] leading-[1.5] text-[var(--muted)]">{{ t('page_desc_tasks', 'System tasks run in the background and keep their prompt, status, response, and related chat records here.') }}</p>
      <div v-if="error" class="mb-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3.5 text-left text-[13px] text-[#b91c1c]">{{ error }}</div>
      <div v-if="loading && !tasks.length" class="rounded-xl p-4 text-center text-[13px] text-[var(--muted)]">Loading tasks...</div>
      <div v-else-if="!tasks.length" class="rounded-xl p-4 text-center text-[13px] text-[var(--muted)]">No system tasks yet</div>

      <div v-else class="grid gap-2">
        <button
          v-for="task in tasks"
          :key="task.id"
          class="flex w-full items-center gap-[11px] rounded-xl border border-[var(--line2)] bg-white p-[11px_12px] text-left shadow-card transition-colors hover:border-[var(--accent)]"
          type="button"
          @click="openTask(task)"
        >
          <span class="h-[9px] w-[9px] shrink-0 rounded-full bg-[var(--muted)] [&.pending]:bg-[var(--fix)] [&.running]:bg-[var(--fix)] [&.done]:bg-[var(--win)] [&.error]:bg-[#b91c1c] [&.aborted]:bg-[#b91c1c]" :class="task.status"></span>
          <span class="min-w-0 flex-1 [&>b]:block [&>b]:overflow-hidden [&>b]:text-ellipsis [&>b]:whitespace-nowrap [&>b]:text-[13.5px] [&>b]:font-semibold [&>b]:text-[var(--ink)] [&>small]:mt-1 [&>small]:block [&>small]:overflow-hidden [&>small]:text-ellipsis [&>small]:whitespace-nowrap [&>small]:text-xs [&>small]:leading-[1.45] [&>small]:text-[var(--muted)]">
            <b>{{ task.name }}</b>
            <small>{{ task.prompt }}</small>
            <small v-if="taskSubscriptionText(task.id)">{{ taskSubscriptionText(task.id) }}</small>
          </span>
          <span class="inline-flex shrink-0 items-center rounded-full bg-[#f3f3f4] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">{{ statusText(task.status) }}</span>
        </button>
      </div>
    </div>

    <div v-else class="mx-auto max-w-[780px]">
      <div v-if="error" class="mb-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3.5 text-left text-[13px] text-[#b91c1c]">{{ error }}</div>
      <article v-if="visibleTask" class="rounded-xl border border-[var(--line2)] bg-white p-[18px] shadow-card">
        <div class="rounded-xl border border-[var(--line2)] bg-white p-[18px] shadow-card-head">
          <div>
            <p>#{{ visibleTask.id }} · {{ statusText(visibleTask.status) }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button type="button" @click="closeDetail">Back</button>
            <button v-if="isActive(visibleTask)" type="button" :disabled="stopping" @click="stopTask">
              {{ stopping ? 'Stopping...' : 'Stop' }}
            </button>
          </div>
        </div>

        <div class="my-3 flex flex-wrap gap-3 text-[12px] leading-[1.5] text-[var(--muted)]">
          <span>Created {{ formatTime(visibleTask.created_at) }}</span>
          <span>Finished {{ formatTime(visibleTask.finished_at) }}</span>
        </div>

        <section>
          <h3>Prompt</h3>
          <pre>{{ visibleTask.prompt }}</pre>
        </section>

        <section v-if="visibleTask.response">
          <h3>Response</h3>
          <pre>{{ visibleTask.response }}</pre>
        </section>

        <section v-if="visibleTask.error">
          <h3>Error</h3>
          <pre class="danger">{{ visibleTask.error }}</pre>
        </section>

        <section v-if="visibleSubscriptions.length">
          <h3>通知</h3>
          <div class="grid gap-[9px]">
            <div v-for="subscription in visibleSubscriptions" :key="subscription.id" class="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
              <div class="border-b border-[var(--line)] bg-[#f7f7f8] px-2.5 py-[7px] font-mono text-[11px] text-[var(--muted)]">subscription #{{ subscription.id }} · {{ subscription.status }}</div>
              <pre>chat: {{ subscription.chat_id }}
created: {{ formatTime(subscription.created_at) }}
fired: {{ formatTime(subscription.fired_at) }}</pre>
            </div>
          </div>
        </section>

        <section v-if="taskMessages.length">
          <h3>Chat record</h3>
          <div class="grid gap-[9px]">
            <div v-for="row in taskMessages" :key="row.id" class="overflow-hidden rounded-[10px] border border-[var(--line)] bg-white">
              <div class="border-b border-[var(--line)] bg-[#f7f7f8] px-2.5 py-[7px] font-mono text-[11px] text-[var(--muted)]">{{ messageRole(row) }}</div>
              <pre>{{ messageText(row) }}</pre>
            </div>
          </div>
        </section>
      </article>
    </div>
  </section>
</template>
