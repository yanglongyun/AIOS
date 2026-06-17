<template>
  <div class="absolute inset-0 flex flex-col overflow-hidden bg-white">

    <!-- New Chat Button -->
    <div class="shrink-0 px-4 pt-4 pb-2">
      <button class="w-full rounded-[8px] border border-[#d1d5db] bg-[#111827] py-3.5 flex items-center justify-center gap-2 font-semibold text-[15px] text-white transition-colors hover:bg-[#1f2937]" @click="$emit('new')">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        {{ t('chat_history_new', '开始新对话') }}
      </button>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto pb-4 [scrollbar-width:none]">
      <div v-if="!chats.length" class="py-16 text-center text-[13px] text-[#a09080]">{{ t('chat_history_empty', '暂无对话记录') }}</div>
      <template v-else>
        <div class="px-[18px] pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#6b7280]" style="font-family:system-ui,sans-serif">{{ t('chat_history_recent', 'Recent') }}</div>
        <button
          v-for="c in chats"
          :key="c.id"
          class="w-full text-left mx-auto block active:scale-[0.985] transition-transform"
          style="padding:0 14px 6px"
          @click="$emit('open', c)"
        >
          <div class="rounded-[8px] overflow-hidden border border-[#e5e7eb] bg-white hover:bg-[#f9fafb]">
            <div class="flex items-center gap-3 px-4 py-3">
              <div class="w-[42px] h-[42px] shrink-0 rounded-[8px] flex items-center justify-center bg-[#f3f4f6] text-[18px]">{{ convIcon(c) }}</div>
              <div class="flex-1 min-w-0">
                <div class="text-[14.5px] font-semibold text-[#111827] truncate">{{ c.title || t('chat_new_title', 'New Chat') }}</div>
                <div class="text-[11px] text-[#6b7280] mt-0.5" style="font-family:system-ui,sans-serif">{{ formatTime(c.updated_at || c.created_at) }}</div>
              </div>
            </div>
          </div>
        </button>
      </template>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { t } from '../lib/locale.js';
defineEmits(['open', 'new']);

const chats = ref([]);

const icons = ['💬','📝','🔍','💡','🛠️','📊','🌐','🎯','📚','✈️','🐍','🎨','🌱','💼','📈'];
function convIcon(c) {
  const idx = (c.id || '').charCodeAt(0) % icons.length;
  return icons[idx];
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return t('time_just_now', '刚刚');
  if (diff < 3600) return t('time_minutes_ago', '{n}分钟前', { n: Math.floor(diff / 60) });
  if (diff < 86400) return t('time_hours_ago', '{n}小时前', { n: Math.floor(diff / 3600) });
  if (diff < 86400 * 7) return t('time_days_ago', '{n}天前', { n: Math.floor(diff / 86400) });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

onMounted(async () => {
  try {
    const res = await fetch('/api/chat/list');
    chats.value = await res.json().catch(() => []);
  } catch {}
});

</script>
