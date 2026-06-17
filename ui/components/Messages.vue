<script setup>
import { nextTick, ref } from 'vue';
import BubbleAi from './bubbles/Ai.vue';
import InputBlock from './bubbles/InputBlock.vue';
import BubbleUser from './bubbles/User.vue';
import ToolCall from './bubbles/ToolCall.vue';
import ToolResult from './bubbles/ToolResult.vue';
import { t } from '../lib/locale.js';

defineProps({
  messages: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: false },
  emptyHints: { type: Array, default: () => [] }
});

const emit = defineEmits(['pick-hint', 'top-reached']);
const msgBox = ref(null);

const scrollToBottom = (smooth = true) => {
  return nextTick(() => {
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
  <div ref="msgBox" class="dotgrid min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-6 scroll-smooth" @scroll="onScroll">
    <div class="mx-auto max-w-[780px] pb-2">
      <div v-if="!messages.length && !busy" class="mx-auto flex max-w-[780px] animate-[rise_0.6s_both] flex-col items-center pt-12 text-center">
        <img src="/cloud.svg" alt="" class="mb-8 w-[150px] select-none" draggable="false" />
        <div class="mb-7 text-3xl font-bold tracking-tight">今天想做点什么?</div>
        <div class="mx-auto flex max-w-[780px] flex-wrap justify-center gap-2 py-1">
          <button
          v-for="hint in emptyHints"
          :key="hint.label"
          class="rounded-full border border-[var(--line2)] bg-white px-3 py-1.5 text-[13px] text-[var(--ink2)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]"
          @click="emit('pick-hint', hint.text)"
        >
            {{ hint.icon }} {{ hint.label }}
          </button>
        </div>
      </div>

      <template v-else>
        <button v-if="hasMore" class="mx-auto mt-2.5 block text-[11.5px] text-[var(--muted)]" type="button">{{ t('chat_load_more', 'Load more...') }}</button>

        <template v-for="(m, i) in messages" :key="m._key || i">
          <BubbleUser v-if="m.role === 'user'" :content="m.content" :attachments="m.attachments" />
          <InputBlock v-else-if="m.role === 'task'" :msg="m" label="Task" />
          <InputBlock v-else-if="m.role === 'compaction'" :msg="m" label="Compaction" />
          <BubbleAi v-else-if="m.role === 'assistant'" :content="m.content" />
          <ToolCall v-else-if="m.type === 'tool_call'" :msg="m" />
          <ToolResult v-else-if="m.type === 'tool_result'" :content="m.content" />
        </template>

        <div v-if="busy" class="my-4 animate-[rise_0.5s_cubic-bezier(0.2,0.7,0.3,1)_both]">
          <div class="mb-1.5 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">Agent</div>
          <div class="flex gap-[5px] py-[3px]">
            <i class="h-[7px] w-[7px] animate-[blink_1.2s_infinite] rounded-full bg-[var(--accent)] opacity-50"></i>
            <i class="h-[7px] w-[7px] animate-[blink_1.2s_infinite] rounded-full bg-[var(--accent)] opacity-50 [animation-delay:0.2s]"></i>
            <i class="h-[7px] w-[7px] animate-[blink_1.2s_infinite] rounded-full bg-[var(--accent)] opacity-50 [animation-delay:0.4s]"></i>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
@keyframes blink {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-3px); }
}
</style>
