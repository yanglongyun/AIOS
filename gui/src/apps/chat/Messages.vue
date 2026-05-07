<script setup>
import { defineExpose, nextTick, ref } from 'vue';
import BubbleUser from './bubbles/User.vue';
import BubbleAi from './bubbles/Ai.vue';
import BubbleToolCall from './bubbles/ToolCall.vue';
import BubbleToolResult from './bubbles/ToolResult.vue';

defineProps({
  messages: { type: Array, default: () => [] },
  streaming: { type: Boolean, default: false },
  hasActive: { type: Boolean, default: false },
  errMsg: { type: String, default: '' }
});

const listEl = ref(null);
function scrollEnd() {
  nextTick(() => { if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight; });
}

defineExpose({ scrollEnd });
</script>

<template>
  <div ref="listEl"
    class="msgs flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 pt-2 pb-6 max-md:px-3 max-md:pb-4">

    <div v-if="!hasActive && !errMsg"
      class="px-0 py-10 text-center text-[13.5px] text-faint">
      选一个对话,或者直接在下方输入开始一段新对话.
    </div>

    <template v-for="(m, i) in messages" :key="m._key || i">
      <BubbleUser     v-if="m.role === 'user'"            :text="m.text" :attachments="m.attachments" />
      <BubbleAi       v-else-if="m.role === 'ai' && m.text" :text="m.text" :remark="m.remark" />
      <BubbleToolCall v-else-if="m.type === 'tool_call'"  :msg="m" />
      <BubbleToolResult v-else-if="m.type === 'tool_result'" :content="m.content" />
    </template>

    <!-- 流式期间的「思考中」指示 -->
    <div v-if="streaming" class="px-1 py-1.5 text-[13px] text-faint">
      思考中<span class="ml-0.5 inline-block tracking-[2px] animate-[chat-pulse_1.2s_ease-in-out_infinite]">…</span>
    </div>
  </div>
</template>

<style scoped>
.msgs > * + * { margin-top: 12px; }

@keyframes chat-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
</style>
