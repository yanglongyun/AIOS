<template>
  <div class="absolute inset-0 flex flex-col overflow-hidden" :style="bgStyle">

    <!-- New Chat Button -->
    <div class="shrink-0 px-4 pt-4 pb-2">
      <button class="w-full rounded-[14px] py-3.5 flex items-center justify-center gap-2 font-bold text-[15px] active:translate-y-[2px] transition-transform" :style="newBtnStyle" @click="$emit('new')">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        开始新对话
      </button>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto pb-4 [scrollbar-width:none]">
      <div v-if="!chats.length" class="py-16 text-center text-[13px] text-[#a09080]">暂无对话记录</div>
      <template v-else>
        <div class="px-[18px] pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#9a7850]" style="font-family:system-ui,sans-serif">最近</div>
        <button
          v-for="c in chats"
          :key="c.id"
          class="w-full text-left mx-auto block active:scale-[0.985] transition-transform"
          style="padding:0 14px 6px"
          @click="$emit('open', c)"
        >
          <div class="rounded-[14px] overflow-hidden" :style="cardStyle">
            <div class="flex items-center gap-3 px-4 py-3">
              <div class="w-[42px] h-[42px] shrink-0 rounded-[12px] flex items-center justify-center text-[20px]" :style="iconStyle">{{ convIcon(c) }}</div>
              <div class="flex-1 min-w-0">
                <div class="text-[14.5px] font-bold text-[#3a2415] truncate">{{ c.title || '新对话' }}</div>
                <div class="text-[11px] text-[#b09870] mt-0.5" style="font-family:system-ui,sans-serif">{{ formatTime(c.updated_at || c.created_at) }}</div>
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
  if (diff < 60) return '刚刚';
  if (diff < 3600) return '{n}分钟前'.replace('{n}', Math.floor(diff / 60));
  if (diff < 86400) return '{n}小时前'.replace('{n}', Math.floor(diff / 3600));
  if (diff < 86400 * 7) return '{n}天前'.replace('{n}', Math.floor(diff / 86400));
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

onMounted(async () => {
  try {
    const res = await fetch('/api/chat/list');
    chats.value = await res.json().catch(() => []);
  } catch {}
});

const bgStyle = {
  background: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(%23n)' opacity='0.04'/></svg>"),linear-gradient(180deg,#f0e8d5 0%,#e8dfca 100%)`,
};
const newBtnStyle = {
  background: 'linear-gradient(180deg,#d4981e 0%,#a07010 100%)',
  boxShadow: '0 4px 0 #6a4800,0 6px 16px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,215,80,0.35)',
  color: 'rgba(255,245,190,0.95)',
  textShadow: '0 1px 3px rgba(0,0,0,0.3)',
};
const cardStyle = {
  background: 'linear-gradient(160deg,#faf5e8 0%,#f2ebd8 100%)',
  boxShadow: '0 2px 8px rgba(90,60,20,0.12),0 1px 2px rgba(90,60,20,0.08),inset 0 1px 0 rgba(255,255,255,0.8)',
  border: '1px solid rgba(180,150,80,0.18)',
};
const iconStyle = {
  background: 'linear-gradient(135deg,#c8941c,#8a6010)',
  boxShadow: '0 3px 8px rgba(90,50,0,0.3),inset 0 1px 0 rgba(255,220,100,0.35),inset 0 -1px 0 rgba(0,0,0,0.15)',
};
</script>
