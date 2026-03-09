<template>
  <div class="fixed inset-0 z-[90]" @click.self="$emit('close')">
    <div class="absolute right-4 top-12 z-[91] flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border border-[#3a2010] bg-[#2e2014] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <div class="flex items-center justify-between border-b border-[#4a3828] px-4 py-2.5">
        <span class="text-sm font-bold text-[#e8d0a8]">通知</span>
        <span class="text-[10px] text-[#8a7860]">{{ unreadCount }} 条未读</span>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div v-if="notifications.length === 0" class="px-4 py-8 text-center text-xs text-[#6a5840]">暂无通知</div>
        <div v-for="n in notifications" :key="n.id" class="border-b border-[#3a2818] px-4 py-2.5 last:border-b-0" :class="n.read ? 'opacity-60' : ''">
          <div class="flex items-center gap-2">
            <span class="rounded bg-[#4a3828] px-1.5 py-0.5 text-[10px] text-[#c8a060]">{{ n.app }}</span>
            <span v-if="!n.read" class="h-1.5 w-1.5 rounded-full bg-[#c07060]"></span>
            <span v-else class="text-[10px] text-[#7a9a6a]">已读</span>
            <span class="ml-auto text-[10px] text-[#6a5840]">{{ formatTime(n.created_at) }}</span>
          </div>
          <div class="mt-1 text-[11px] font-bold text-[#d8c0a0]">{{ n.title }}</div>
          <div v-if="n.content" class="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#b8a080]">{{ n.content }}</div>
          <div v-if="n.reply" class="mt-1 rounded bg-[#3a2818] px-2 py-1 text-[10px] text-[#a0907a]">AI: {{ n.reply }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  notifications: { type: Array, default: () => [] },
  unreadCount: { type: Number, default: 0 }
});

defineEmits(['close']);

const formatTime = (t) => {
  if (!t) return '';
  return String(t).slice(11, 16);
};
</script>
