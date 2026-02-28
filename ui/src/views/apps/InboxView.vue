<template>
  <div class="p-6 w-full max-w-4xl mx-auto h-full overflow-y-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold italic tracking-tight text-neutral-800 dark:text-neutral-100">Inbox.</h1>
        <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">接收来自外部网页的提交信息</p>
      </div>
      <div class="text-right">
        <p class="text-[10px] uppercase tracking-widest text-neutral-400">未读</p>
        <p class="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ unread }}</p>
      </div>
    </div>

    <section class="bg-neutral-100 dark:bg-neutral-800/30 p-3 rounded-2xl mb-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-semibold text-neutral-700 dark:text-neutral-200">对外提交页</p>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">复制地址后发给外部用户提交信息</p>
          <p class="text-xs text-indigo-600 dark:text-indigo-400 mt-1 break-all">{{ publicUrl }}</p>
        </div>
        <button
          @click="copySubmitUrl"
          class="bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90"
        >
          {{ copied ? '已复制' : '复制' }}
        </button>
      </div>
    </section>

    <section class="bg-white dark:bg-transparent rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
      <div class="px-6 py-4 border-b border-neutral-50 dark:border-neutral-800 flex justify-between items-center bg-gray-50/50 dark:bg-neutral-800/50">
        <h3 class="text-sm font-bold uppercase tracking-widest text-neutral-400">消息列表</h3>
        <div class="flex items-center gap-2">
          <select v-model="readFilter" @change="fetchMessages" class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="all">全部</option>
            <option value="unread">仅未读</option>
            <option value="read">仅已读</option>
          </select>
          <button @click="fetchMessages" class="bg-neutral-900 dark:bg-white dark:text-neutral-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90">刷新</button>
          <span class="text-[10px] text-neutral-400">{{ messages.length }} 条</span>
        </div>
      </div>

      <div class="divide-y divide-neutral-50 dark:divide-neutral-800">
        <article v-for="m in messages" :key="m.id" class="px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span v-if="!m.is_read" class="inline-block text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">未读</span>
                <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{{ m.name || '匿名' }}</span>
                <span class="text-xs text-neutral-400">{{ m.email || '无邮箱' }}</span>
              </div>
              <p class="whitespace-pre-wrap break-words text-sm leading-6 text-neutral-700 dark:text-neutral-200">{{ m.content }}</p>
              <div class="mt-2 text-[11px] text-neutral-400">{{ formatDate(m.created_at) }} · {{ m.source_ip || 'unknown ip' }}</div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button @click="toggleRead(m)" class="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800">
                {{ m.is_read ? '标未读' : '标已读' }}
              </button>
              <button @click="remove(m.id)" class="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs hover:bg-rose-50">删除</button>
            </div>
          </div>
        </article>

        <div v-if="!messages.length" class="py-20 text-center text-neutral-400 text-sm">暂无消息</div>
      </div>
    </section>
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
    setTimeout(() => { copied.value = false; }, 1200);
  } catch {}
};

const formatDate = (v) => {
  if (!v) return '';
  const d = new Date(v.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString('zh-CN', { hour12: false });
};

onMounted(fetchMessages);
</script>
