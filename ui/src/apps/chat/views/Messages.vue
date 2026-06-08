<script setup>
import { nextTick, ref } from 'vue';
import BubbleAi from './bubbles/Ai.vue';
import BubbleSubscription from './bubbles/Subscription.vue';
import BubbleUser from './bubbles/User.vue';
import ToolCall from './bubbles/ToolCall.vue';
import ToolResult from './bubbles/ToolResult.vue';

defineProps({
  messages: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: false },
  emptyHints: { type: Array, default: () => [] }
});

const emit = defineEmits(['pick-hint', 'top-reached']);
const msgBox = ref(null);

const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    const el = msgBox.value;
    if (!el) return;
    if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    else el.scrollTop = el.scrollHeight;
  });
};

const onScroll = () => {
  const el = msgBox.value;
  if (el && el.scrollTop < 50) emit('top-reached', el.scrollHeight);
};

defineExpose({ msgBox, scrollToBottom });
</script>

<template>
  <div ref="msgBox" class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 [scrollbar-width:none]" @scroll="onScroll">
    <div v-if="!messages.length && !busy" class="flex h-full flex-col items-center justify-center px-5">
      <p class="mb-1 text-[20px] font-bold text-[#3a2415]">AIOS</p>
      <p class="mb-5 text-[12px] text-[#9a7860]">你的本地 AI 系统，对话即操作</p>
      <div class="flex w-full max-w-[300px] flex-col gap-2">
        <div
          v-for="hint in emptyHints"
          :key="hint.label"
          class="flex cursor-pointer items-center gap-2.5 rounded-[14px] border border-[rgba(180,150,80,0.2)] bg-[linear-gradient(160deg,#faf5e8_0%,#f0e8d4_100%)] px-3.5 py-3 shadow-[0_2px_8px_rgba(90,60,20,0.08),inset_0_1px_0_rgba(255,255,255,0.7)] transition-[transform,box-shadow] duration-150 active:scale-[0.97] active:shadow-[0_1px_4px_rgba(90,60,20,0.12)]"
          @click="emit('pick-hint', hint.text)"
        >
          <span class="shrink-0 text-[16px] leading-none">{{ hint.icon }}</span>
          <div class="min-w-0">
            <div class="text-[13px] font-semibold text-[#4a3520]">{{ hint.label }}</div>
            <div class="text-[11px] text-[#9a7860] leading-snug">{{ hint.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <div v-if="hasMore" class="py-2 text-center text-[11px] text-[#9a8060]">加载更多...</div>
      <div class="date-sep mb-4">今天</div>

      <template v-for="(m, i) in messages" :key="m._key || i">
        <BubbleUser v-if="m.role === 'user'" :content="m.content" :attachments="m.attachments" />
        <BubbleSubscription v-else-if="m.role === 'subscription'" :content="m.content" />
        <BubbleAi v-else-if="m.role === 'assistant'" :content="m.content" />
        <ToolCall v-else-if="m.type === 'tool_call'" :msg="m" />
        <ToolResult v-else-if="m.type === 'tool_result'" :content="m.content" />
      </template>

      <div v-if="busy" class="mb-4 flex items-end">
        <div class="flex items-center gap-[5px] rounded-2xl border border-[rgba(180,150,80,0.2)] bg-[linear-gradient(160deg,#faf5e8_0%,#f2ebd8_100%)] px-4 py-3 shadow-[0_3px_12px_rgba(90,60,20,0.12),inset_0_1px_0_rgba(255,255,255,0.7)]">
          <div class="typing-dot size-[7px] rounded-full bg-[#a08858]"></div>
          <div class="typing-dot size-[7px] rounded-full bg-[#a08858]"></div>
          <div class="typing-dot size-[7px] rounded-full bg-[#a08858]"></div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.date-sep {
  text-align: center;
  font-size: 11px;
  color: #9a8060;
  font-family: system-ui, sans-serif;
  display: flex;
  align-items: center;
  gap: 8px;
}
.date-sep::before, .date-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(120,90,50,0.2), transparent);
}
.typing-dot {
  animation: bounce 1.2s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-5px); opacity: 1; }
}
</style>
