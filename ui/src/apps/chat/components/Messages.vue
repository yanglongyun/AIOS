<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { MessageCircle, Copy, Check, Info } from 'lucide-vue-next';
import BubbleAi from './bubbles/Ai.vue';
import BubbleSubscription from './bubbles/Subscription.vue';
import BubbleUser from './bubbles/User.vue';
import ToolGroup from './bubbles/ToolGroup.vue';

const props = defineProps({
  messages: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: false },
  emptyHints: { type: Array, default: () => [] }
});

const emit = defineEmits(['pick-hint', 'top-reached']);
const msgBox = ref(null);

// 把相邻的工具消息聚合成组，其余消息按原样成块
const isToolMsg = (m) => m.type === 'tool_call' || m.type === 'tool_result';
const blocks = computed(() => {
  const out = [];
  for (const m of props.messages) {
    if (isToolMsg(m)) {
      const last = out[out.length - 1];
      if (last?.kind === 'tools') {
        last.items.push(m);
        continue;
      }
      out.push({ kind: 'tools', items: [m], key: `tg:${m._key || out.length}` });
    } else {
      out.push({ kind: 'msg', m, key: m._key || `m:${out.length}` });
    }
  }
  return out;
});

const heroHints = computed(() => props.emptyHints.slice(0, 3));

// ── AI 反馈栏：复制 + token 用量 ──
const activePop = ref('');
const copiedKey = ref('');

const copyMsg = async (block) => {
  const text = String(block.m.content || '');
  try {
    await navigator.clipboard.writeText(text);
    copiedKey.value = block.key;
    setTimeout(() => { if (copiedKey.value === block.key) copiedKey.value = ''; }, 1200);
  } catch {}
};

const usageOf = (m) => {
  const u = m.usage || m.tokens || null;
  const input = u?.input ?? u?.prompt_tokens ?? u?.input_tokens;
  const output = u?.output ?? u?.completion_tokens ?? u?.output_tokens;
  const fmt = (v) => (v == null ? '-' : Number(v).toLocaleString());
  const total = input != null || output != null ? Number(input || 0) + Number(output || 0) : null;
  return { input: fmt(input), output: fmt(output), total: fmt(total) };
};

const togglePop = (block) => {
  activePop.value = activePop.value === block.key ? '' : block.key;
};

const onDocClick = (e) => {
  if (activePop.value && !e.target.closest('.msg-feedback')) activePop.value = '';
};

onMounted(() => document.addEventListener('click', onDocClick));
onUnmounted(() => document.removeEventListener('click', onDocClick));

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
  <div ref="msgBox" class="dot-grid min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-6 [scrollbar-width:none]" @scroll="onScroll">
    <div class="msg-col">
    <!-- 空态 hero -->
    <div v-if="!messages.length && !busy" class="flex flex-1 flex-col items-center justify-center px-5">
      <div class="hero-logo mb-6 grid h-14 w-14 place-items-center rounded-2xl">
        <MessageCircle :size="28" :stroke-width="1.9" />
      </div>
      <p class="mb-7 text-[32px] font-bold tracking-[-0.5px] text-ink">{{ '今天想做点什么?' }}</p>
      <div class="flex w-full max-w-[560px] flex-wrap justify-center gap-2.5">
        <div
          v-for="hint in heroHints"
          :key="hint.label"
          class="chip-card"
          :title="hint.desc"
          @click="emit('pick-hint', hint.text)"
        >
          <span class="shrink-0 text-[15px] leading-none">{{ hint.icon }}</span>
          <span class="text-[13px] font-medium text-ink">{{ hint.label }}</span>
        </div>
      </div>
    </div>

    <template v-else>
      <div v-if="hasMore" class="py-2 text-center text-[11px] text-faint">{{ '加载更多...' }}</div>

      <template v-for="block in blocks" :key="block.key">
        <ToolGroup v-if="block.kind === 'tools'" :items="block.items" :busy="busy" />

        <template v-else-if="block.m.role === 'assistant'">
          <div class="msg-card soft-card">
            <BubbleAi :content="block.m.content" />
          </div>
          <div class="msg-feedback">
            <button type="button" class="fb-btn" :title="'复制'" @click="copyMsg(block)">
              <Copy v-if="copiedKey !== block.key" :size="15" :stroke-width="1.8" />
              <Check v-else :size="15" :stroke-width="2.2" style="color: var(--color-good, #2e9e5b)" />
            </button>
            <button type="button" class="fb-btn" :title="'用量'" @click.stop="togglePop(block)">
              <Info :size="15" :stroke-width="1.8" />
            </button>
            <div v-if="activePop === block.key" class="token-pop">
              <div class="row"><span>{{ '输入 tokens' }}</span><b>{{ usageOf(block.m).input }}</b></div>
              <div class="row"><span>{{ '输出 tokens' }}</span><b>{{ usageOf(block.m).output }}</b></div>
              <div class="row"><span>{{ '合计' }}</span><b>{{ usageOf(block.m).total }}</b></div>
            </div>
          </div>
        </template>

        <BubbleUser v-else-if="block.m.role === 'user'" :content="block.m.content" :attachments="block.m.attachments" />
        <BubbleSubscription v-else-if="block.m.role === 'subscription'" :content="block.m.content" />
      </template>

      <div v-if="busy" class="mb-4 flex items-end">
        <div class="flex items-center gap-[5px] rounded-xl border border-line bg-bg-elev px-4 py-3 shadow-[var(--shadow-sm)]">
          <div class="typing-dot size-[7px] rounded-full bg-[var(--color-faint)]"></div>
          <div class="typing-dot size-[7px] rounded-full bg-[var(--color-faint)]"></div>
          <div class="typing-dot size-[7px] rounded-full bg-[var(--color-faint)]"></div>
        </div>
      </div>
    </template>
    </div>
  </div>
</template>

<style scoped>
.hero-logo {
  background: var(--color-blue-bg);
  border: 1px solid var(--color-blue-soft);
  color: var(--color-blue-fg);
}
.msg-col {
  width: min(860px, 100%);
  min-height: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
}
.msg-card {
  width: min(720px, 96%);
  padding: 22px 26px;
}
.msg-card :deep(.ai-bubble) {
  max-width: 100%;
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
  border-radius: 0;
}
.msg-card :deep(.mb-4) {
  margin-bottom: 0;
}
.msg-feedback {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 4px 14px;
  width: min(720px, 96%);
}
.fb-btn {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-faint);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.fb-btn:hover {
  background: color-mix(in srgb, var(--color-ink) 6%, transparent);
  color: var(--color-ink);
}
.token-pop {
  position: absolute;
  left: 36px;
  bottom: 40px;
  z-index: 20;
  background: var(--color-bg-elev);
  border: 1px solid var(--color-line);
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(20, 20, 25, 0.12);
  padding: 10px 14px;
  font-size: 12.5px;
  color: var(--color-muted);
  white-space: nowrap;
}
.token-pop b {
  color: var(--color-ink);
  font-weight: 600;
}
.token-pop .row {
  display: flex;
  justify-content: space-between;
  gap: 22px;
  padding: 2px 0;
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
