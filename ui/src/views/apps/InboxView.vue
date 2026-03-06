<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden bg-[#f0ebe3] bg-[radial-gradient(circle_at_30%_70%,rgba(139,90,43,0.03)_0%,transparent_50%),radial-gradient(circle_at_70%_30%,rgba(139,90,43,0.02)_0%,transparent_40%),repeating-linear-gradient(90deg,transparent,transparent_80px,rgba(139,90,43,0.015)_80px,rgba(139,90,43,0.015)_81px)] font-['Georgia','PingFang_SC',serif] text-[#5a5048]">
    <div class="relative z-[1] flex shrink-0 items-end justify-between px-6 pt-6">
      <h1 class="text-2xl font-extrabold text-[#7a6a58]">{{ t('inbox_title') }} <span class="ml-1 text-xl">📬</span></h1>
      <span v-if="unread > 0" class="rounded-full bg-[#d4756a] px-3 py-1 text-[13px] font-bold text-white shadow-[0_2px_6px_rgba(212,117,106,0.25)]">{{ t('inbox_unread_count', { n: unread }) }}</span>
    </div>

    <div class="relative z-[1] mx-6 mt-4 flex shrink-0 flex-col gap-3 rounded bg-[#faf6f0] px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-[#e8e0d4]">
      <div class="min-w-0 flex-1">
        <div class="break-all font-mono text-[11px] text-[#9a8a78]">{{ publicUrl }}</div>
        <div class="mt-1 text-[11px] leading-relaxed text-[#a59686]">{{ t('inbox_submit_desc') }}</div>
      </div>
      <div class="min-w-0 flex-1 border-t border-dashed border-[#eadfce] pt-3">
        <div class="break-all font-mono text-[11px] text-[#9a8a78]">{{ feedUrl }}</div>
        <div class="mt-1 text-[11px] leading-relaxed text-[#a59686]">{{ t('inbox_feed_desc') }}</div>
      </div>
      <div class="flex w-full flex-wrap items-center justify-end gap-2">
        <button class="whitespace-nowrap rounded border border-[#d4c8b8] bg-[#f7f1e8] px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[#8a7a68] transition-colors hover:bg-[#efe4d6]" @click="openSubmitUrl">{{ t('inbox_open') }}</button>
        <button class="whitespace-nowrap rounded bg-[#8a7a68] px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[#faf6f0] transition-colors hover:bg-[#9a8a78]" @click="copySubmitUrl">{{ copied ? t('inbox_copied') : t('inbox_copy_submit') }}</button>
        <button class="whitespace-nowrap rounded border border-[#d4c8b8] bg-[#f7f1e8] px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[#8a7a68] transition-colors hover:bg-[#efe4d6]" @click="openFeedUrl">{{ t('inbox_weibo_feed') }}</button>
        <button class="whitespace-nowrap rounded bg-[#8a7a68] px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[#faf6f0] transition-colors hover:bg-[#9a8a78]" @click="copyFeedUrl">{{ feedCopied ? t('inbox_copied') : t('inbox_copy_feed') }}</button>
        <button class="whitespace-nowrap rounded border border-[#d4c8b8] bg-[#f7f1e8] px-4 py-2 text-xs font-semibold tracking-[0.08em] text-[#8a7a68] transition-colors hover:bg-[#efe4d6]" @click="openWeiboApp">{{ t('inbox_manage_weibo') }}</button>
      </div>
    </div>

    <div class="relative z-[1] flex shrink-0 items-center justify-between px-6 pb-2 pt-4">
      <div class="flex items-center gap-2">
        <button class="rounded border border-[#d4c8b8] px-3.5 py-1.5 text-xs text-[#a89888] transition-all hover:bg-[#f5ead0]" :class="readFilter === 'all' ? 'border-[#8a7a68] bg-[#8a7a68] text-[#faf6f0]' : ''" @click="readFilter = 'all'; fetchMessages()">{{ t('inbox_filter_all') }}</button>
        <button class="rounded border border-[#d4c8b8] px-3.5 py-1.5 text-xs text-[#a89888] transition-all hover:bg-[#f5ead0]" :class="readFilter === 'unread' ? 'border-[#8a7a68] bg-[#8a7a68] text-[#faf6f0]' : ''" @click="readFilter = 'unread'; fetchMessages()">{{ t('inbox_filter_unread') }}</button>
        <button class="rounded border border-[#d4c8b8] px-3.5 py-1.5 text-xs text-[#a89888] transition-all hover:bg-[#f5ead0]" :class="readFilter === 'read' ? 'border-[#8a7a68] bg-[#8a7a68] text-[#faf6f0]' : ''" @click="readFilter = 'read'; fetchMessages()">{{ t('inbox_filter_read') }}</button>
      </div>
      <span class="text-[11px] text-[#c4b8a8]">{{ t('inbox_count', { n: messages.length }) }}</span>
    </div>

    <div class="relative z-[1] flex-1 overflow-y-auto px-6 pb-6 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div v-if="!messages.length" class="flex h-full flex-col items-center justify-center gap-2 text-[#c4b8a8]">
        <span class="text-5xl opacity-50">📭</span>
        <p class="text-sm ">{{ t('inbox_empty') }}</p>
      </div>

      <div
        v-for="m in messages"
        :key="m.id"
        class="group relative mb-3 cursor-default rounded bg-[#faf6f0] px-[22px] pb-5 pt-5 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-[#e8e0d4] transition-all before:absolute before:left-0 before:right-0 before:top-0 before:h-1.5 before:rounded-t before:bg-[repeating-linear-gradient(90deg,#d4968e_0,#d4968e_10px,#8eaad4_10px,#8eaad4_20px)] hover:-translate-y-px hover:shadow-[0_2px_6px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.08)]"
      >
        <div v-if="!m.is_read" class="absolute right-4 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-[radial-gradient(circle_at_40%_35%,#e0887e,#c06858)] text-[11px] font-bold text-white/90 shadow-[0_1px_4px_rgba(192,104,88,0.3)]">{{ t('inbox_new') }}</div>

        <div class="mb-2 flex items-center gap-2">
          <div>
            <div class="text-sm font-bold text-[#7a6a58]">{{ m.name || t('inbox_anonymous') }}</div>
            <div class="text-[11px] text-[#b8a898]">{{ m.email || t('inbox_no_email') }}</div>
          </div>
        </div>

        <div class="my-2.5 whitespace-pre-wrap break-words bg-[repeating-linear-gradient(transparent,transparent_27px,rgba(180,160,130,0.12)_27px,rgba(180,160,130,0.12)_28px)] bg-[position:0_2px] text-sm leading-[1.8] text-[#6a5e50]">{{ m.content }}</div>

        <!-- 建议回复 -->
        <div v-if="m.reply_suggestion" class="mt-2 rounded border border-[#e0d8cc] bg-[#f5efe6] px-4 py-3">
          <div class="mb-1.5 flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase tracking-[1px] text-[#b8a898]">{{ t('inbox_suggested_reply') }}</span>
            <button class="text-[11px] text-[#a89888] transition-colors hover:text-[#8a7a68]" :disabled="suggesting[m.id]" @click="suggest(m.id)">{{ suggesting[m.id] ? t('inbox_generating') : t('inbox_regenerate') }}</button>
          </div>
          <div class="whitespace-pre-wrap text-[13px] leading-[1.8] text-[#6a5e50]">{{ m.reply_suggestion }}</div>
        </div>

        <div class="mt-2.5 flex items-center justify-between">
          <span class="text-[11px] text-[#c4b8a8]">📅 {{ formatDate(m.created_at) }} · 🌐 {{ m.source_ip || 'unknown' }}</span>
          <div class="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button v-if="!m.reply_suggestion" class="rounded border-[1.5px] border-[#e0d4c8] bg-white/50 px-3.5 py-1 text-[11px] text-[#a89888] transition-all hover:border-[#8a7a68] hover:bg-[#8a7a68] hover:text-[#faf6f0]" :disabled="suggesting[m.id]" @click="suggest(m.id)">{{ suggesting[m.id] ? t('inbox_generating') : t('inbox_suggest_reply') }}</button>
            <button class="rounded border-[1.5px] border-[#e0d4c8] bg-white/50 px-3.5 py-1 text-[11px] text-[#a89888] transition-all hover:border-[#8a7a68] hover:bg-[#8a7a68] hover:text-[#faf6f0]" @click="toggleRead(m)">{{ m.is_read ? t('inbox_mark_unread') : t('inbox_mark_read') }}</button>
            <button class="rounded border-[1.5px] border-[#e0d4c8] bg-white/50 px-3.5 py-1 text-[11px] text-[#a89888] transition-all hover:border-[#d4756a] hover:bg-[#d4756a] hover:text-white" @click="remove(m.id)">{{ t('common_delete') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="relative z-[1] shrink-0 border-t border-dashed border-[#d8d0c4] px-6 py-3 text-center text-[11px] text-[#c4b8a8]">📮 {{ t('inbox_footer') }}</div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from '../../i18n/index.js';

const { t, locale } = useI18n();

const API_BASE = '/apps/inbox';
const publicUrl = `${window.location.origin}/apps/inbox/submit`;
const feedUrl = `${window.location.origin}/apps/weibo/feed`;

const messages = ref([]);
const unread = ref(0);
const readFilter = ref('all');
const copied = ref(false);
const feedCopied = ref(false);
const suggesting = reactive({});

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

const suggest = async (id) => {
  suggesting[id] = true;
  try {
    const res = await fetch(`${API_BASE}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success) {
      const msg = messages.value.find(m => m.id === id);
      if (msg) msg.reply_suggestion = data.suggestion;
    }
  } catch {}
  suggesting[id] = false;
};

const copySubmitUrl = async () => {
  try {
    await navigator.clipboard.writeText(publicUrl);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 1500);
  } catch {}
};

const openSubmitUrl = () => {
  window.open(publicUrl, '_blank', 'noopener,noreferrer');
};

const copyFeedUrl = async () => {
  try {
    await navigator.clipboard.writeText(feedUrl);
    feedCopied.value = true;
    setTimeout(() => { feedCopied.value = false; }, 1500);
  } catch {}
};

const openFeedUrl = () => {
  window.open(feedUrl, '_blank', 'noopener,noreferrer');
};

const openWeiboApp = () => {
  window.location.href = '/weibo';
};

const formatDate = (v) => {
  if (!v) return '';
  const d = new Date(v.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return v;
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return t('inbox_just_now');
  if (diff < 3600000) return t('inbox_minutes_ago', { n: Math.floor(diff / 60000) });
  if (diff < 86400000) return t('inbox_hours_ago', { n: Math.floor(diff / 3600000) });
  if (diff < 604800000) return t('inbox_days_ago', { n: Math.floor(diff / 86400000) });
  return d.toLocaleDateString(locale.value === 'en' ? 'en-US' : 'zh-CN', { month: 'short', day: 'numeric' });
};

onMounted(() => {
  fetchMessages();
});
</script>
