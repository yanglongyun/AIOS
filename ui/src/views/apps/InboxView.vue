<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden bg-[#f0ebe3] bg-[radial-gradient(circle_at_30%_70%,rgba(139,90,43,0.03)_0%,transparent_50%),radial-gradient(circle_at_70%_30%,rgba(139,90,43,0.02)_0%,transparent_40%),repeating-linear-gradient(90deg,transparent,transparent_80px,rgba(139,90,43,0.015)_80px,rgba(139,90,43,0.015)_81px)] font-['Georgia','PingFang_SC',serif] text-[#5a5048]">
    <div class="relative z-[1] flex shrink-0 items-end justify-between px-6 pt-6">
      <h1 class="text-2xl font-extrabold italic text-[#7a6a58]">收件箱 <span class="ml-1 text-xl">📬</span></h1>
      <span v-if="unread > 0" class="rounded-full bg-[#d4756a] px-3 py-1 text-[13px] font-bold text-white shadow-[0_2px_6px_rgba(212,117,106,0.25)]">{{ unread }} 封未读</span>
    </div>

    <div class="relative z-[1] mx-6 mt-4 flex shrink-0 items-center justify-between gap-3 rounded bg-[#faf6f0] px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e8e0d4]">
      <div class="min-w-0 flex-1">
        <div class="text-xs italic text-[#b8a898]">📮 对外投信地址</div>
        <div class="mt-1 break-all font-mono text-[11px] text-[#9a8a78]">{{ publicUrl }}</div>
      </div>
      <button class="whitespace-nowrap rounded bg-[#8a7a68] px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[#faf6f0] transition-colors hover:bg-[#9a8a78]" @click="copySubmitUrl">{{ copied ? '已复制 ✓' : '复制地址' }}</button>
    </div>

    <div class="relative z-[1] flex shrink-0 items-center justify-between px-6 pb-2 pt-4">
      <div class="flex items-center gap-2">
        <button class="rounded border border-[#d4c8b8] px-3.5 py-1.5 text-xs text-[#a89888] transition-all hover:bg-[#f5ead0]" :class="readFilter === 'all' ? 'border-[#8a7a68] bg-[#8a7a68] text-[#faf6f0]' : ''" @click="readFilter = 'all'; fetchMessages()">全部</button>
        <button class="rounded border border-[#d4c8b8] px-3.5 py-1.5 text-xs text-[#a89888] transition-all hover:bg-[#f5ead0]" :class="readFilter === 'unread' ? 'border-[#8a7a68] bg-[#8a7a68] text-[#faf6f0]' : ''" @click="readFilter = 'unread'; fetchMessages()">未读</button>
        <button class="rounded border border-[#d4c8b8] px-3.5 py-1.5 text-xs text-[#a89888] transition-all hover:bg-[#f5ead0]" :class="readFilter === 'read' ? 'border-[#8a7a68] bg-[#8a7a68] text-[#faf6f0]' : ''" @click="readFilter = 'read'; fetchMessages()">已读</button>
      </div>
      <span class="text-[11px] italic text-[#c4b8a8]">{{ messages.length }} 封信件</span>
    </div>

    <div class="relative z-[1] flex-1 overflow-y-auto px-6 pb-6 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div v-if="!messages.length" class="flex h-full flex-col items-center justify-center gap-2 text-[#c4b8a8]">
        <span class="text-5xl opacity-50">📭</span>
        <p class="text-sm italic">暂无来信</p>
      </div>

      <div
        v-for="m in messages"
        :key="m.id"
        class="group relative mb-3 cursor-default rounded bg-[#faf6f0] px-[22px] pb-5 pt-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-[#e8e0d4] transition-all before:absolute before:left-0 before:right-0 before:top-0 before:h-1.5 before:rounded-t before:bg-[repeating-linear-gradient(90deg,#d4968e_0,#d4968e_10px,#8eaad4_10px,#8eaad4_20px)] hover:-translate-y-px hover:shadow-[0_2px_6px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.08)]"
        :class="{ 'border-l-4 border-l-[#d4968e]': !m.is_read }"
      >
        <div v-if="!m.is_read" class="absolute right-4 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-[radial-gradient(circle_at_40%_35%,#e0887e,#c06858)] text-[11px] font-bold text-white/90 shadow-[0_1px_4px_rgba(192,104,88,0.3)]">新</div>

        <div class="mb-2 flex items-center gap-2">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#e0d4c8] bg-[#f0e8dc] text-sm">{{ getSenderEmoji(m.name) }}</div>
          <div>
            <div class="text-sm font-bold text-[#7a6a58]">{{ m.name || '匿名' }}</div>
            <div class="text-[11px] italic text-[#b8a898]">{{ m.email || '无邮箱' }}</div>
          </div>
        </div>

        <div class="my-2.5 whitespace-pre-wrap break-words bg-[repeating-linear-gradient(transparent,transparent_27px,rgba(180,160,130,0.12)_27px,rgba(180,160,130,0.12)_28px)] bg-[position:0_2px] pl-10 text-sm leading-[1.8] text-[#6a5e50]">{{ m.content }}</div>

        <div class="mt-2.5 flex items-center justify-between pl-10">
          <span class="text-[11px] italic text-[#c4b8a8]">📅 {{ formatDate(m.created_at) }} · 🌐 {{ m.source_ip || 'unknown' }}</span>
          <div class="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button class="rounded border-[1.5px] border-[#e0d4c8] bg-white/50 px-3.5 py-1 text-[11px] text-[#a89888] transition-all hover:border-[#8a7a68] hover:bg-[#8a7a68] hover:text-[#faf6f0]" @click="toggleRead(m)">{{ m.is_read ? '标未读' : '标已读' }}</button>
            <button class="rounded border-[1.5px] border-[#e0d4c8] bg-white/50 px-3.5 py-1 text-[11px] text-[#a89888] transition-all hover:border-[#d4756a] hover:bg-[#d4756a] hover:text-white" @click="remove(m.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div class="relative z-[1] shrink-0 border-t border-dashed border-[#d8d0c4] px-6 py-3 text-center text-[11px] italic text-[#c4b8a8]">📮 AIOS 邮局 · 本地投递</div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const API_BASE = 'http://localhost:9701/apps/inbox';
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
    setTimeout(() => { copied.value = false; }, 1500);
  } catch {}
};

const formatDate = (v) => {
  if (!v) return '';
  const d = new Date(v.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return v;
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const senderEmojis = ['🧑', '👩', '👨‍💻', '🎨', '🌍', '🤖', '👾', '🦊', '🐱', '🐻'];
const getSenderEmoji = (name) => {
  if (!name) return '🤖';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return senderEmojis[Math.abs(hash) % senderEmojis.length];
};

onMounted(fetchMessages);
</script>
