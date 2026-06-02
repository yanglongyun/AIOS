<script setup>
import { computed, nextTick, ref } from 'vue';
import BubbleUser from './bubbles/User.vue';
import BubbleAi from './bubbles/Ai.vue';
import BubbleToolCall from './bubbles/ToolCall.vue';
import BubbleToolResult from './bubbles/ToolResult.vue';
import BubbleNotice from './bubbles/Notice.vue';

const props = defineProps({
  messages: { type: Array, default: () => [] },
  streaming: { type: Boolean, default: false },
  hasActive: { type: Boolean, default: false },
  errMsg: { type: String, default: '' },
  hasMore: { type: Boolean, default: false },
  loadingOlder: { type: Boolean, default: false }
});

const emit = defineEmits(['pick', 'load-older']);

const listEl = ref(null);
function scrollEnd() {
  nextTick(() => { if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight; });
}
function snapshotScroll() {
  const el = listEl.value;
  return el ? { top: el.scrollTop, height: el.scrollHeight } : { top: 0, height: 0 };
}
function restorePrepended(before) {
  nextTick(() => {
    const el = listEl.value;
    if (!el) return;
    el.scrollTop = el.scrollHeight - before.height + before.top;
  });
}
function onScroll() {
  const el = listEl.value;
  if (!el || !props.hasActive || !props.hasMore || props.loadingOlder) return;
  if (el.scrollTop <= 80) emit('load-older');
}
defineExpose({ scrollEnd, snapshotScroll, restorePrepended });

// ─── 欢迎页内容 ─────────────────────────────────
const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return 'NIGHT CYCLE';
  if (h < 12) return 'MORNING SHIFT';
  if (h < 18) return 'DAY SHIFT';
  return 'EVENING SHIFT';
});

const suggests = [
  { icon: 'edit_note', label: '起草内容', prompt: '帮我起草一段' },
  { icon: 'route', label: '拆解计划', prompt: '把这件事拆成可执行步骤:' },
  { icon: 'summarize', label: '提炼要点', prompt: '总结下面内容的关键点:\n\n' },
  { icon: 'code', label: '构建代码', prompt: '实现一个功能:' },
  { icon: 'search', label: '分析资料', prompt: '基于下面信息做判断:\n\n' },
  { icon: 'psychology', label: '写入记忆', prompt: '这件事需要长期记住:' }
];

const pick = (s) => emit('pick', s.prompt);
</script>

<template>
  <div ref="listEl"
    @scroll="onScroll"
    class="msgs flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-0 pt-3 pb-6 max-md:px-3 max-md:pb-4">
    <div v-if="hasActive && (hasMore || loadingOlder)" class="load-older">
      {{ loadingOlder ? '加载中...' : '向上滚动加载更早消息' }}
    </div>

    <!-- 欢迎页 (没选中对话 & 没消息 & 没错误) -->
    <div v-if="!hasActive && !errMsg && !messages.length"
      class="welcome relative mx-auto flex min-h-full max-w-[640px] flex-col items-center px-4 text-center">

      <!-- 顶部光晕 -->
      <div class="welcome-halo"></div>

      <div class="welcome-mark">AIOS / AGENT</div>
      <h1 class="welcome-greeting">{{ greeting }}</h1>
      <p class="welcome-sub">选择一条指令，或直接输入新的操作目标。</p>

      <div class="welcome-suggests">
        <button
          v-for="s in suggests"
          :key="s.label"
          class="welcome-chip"
          type="button"
          @click="pick(s)">
          <span class="msi">{{ s.icon }}</span>
          <span>{{ s.label }}</span>
        </button>
      </div>

      <div class="welcome-tip">
        <span class="msi text-[14px] align-[-2px]">arrow_downward</span>
        INPUT CHANNEL READY
      </div>
    </div>

    <template v-for="(m, i) in messages" :key="m._key || i">
      <div v-if="m.role === 'user'" class="message-row flex justify-end">
        <BubbleUser :text="m.text" :attachments="m.attachments" />
      </div>
      <div v-else-if="m.role === 'ai' && m.text" class="message-row flex justify-start">
        <BubbleAi :text="m.text" :remark="m.remark" />
      </div>
      <div v-else-if="m.role === 'notice'" class="message-row flex justify-center">
        <BubbleNotice :text="m.text" />
      </div>
      <div v-else-if="m.type === 'tool_call'" class="message-row flex justify-start">
        <BubbleToolCall :msg="m" />
      </div>
      <div v-else-if="m.type === 'tool_result'" class="message-row flex justify-start">
        <BubbleToolResult :content="m.content" />
      </div>
    </template>

    <!-- 等待完整回复时的状态指示 -->
    <div v-if="streaming" class="message-row px-1 py-1.5 text-[13px] text-faint">
      思考中<span class="ml-0.5 inline-block tracking-[2px] animate-[chat-pulse_1.2s_ease-in-out_infinite]">…</span>
    </div>
  </div>
</template>

<style scoped>
.msgs > * + * { margin-top: 12px; }
.msgs > .welcome + * { margin-top: 0; }
.msgs { scrollbar-gutter: stable both-edges; }
.message-row {
  width: calc(100% - 32px);
  max-width: 760px;
  margin-left: auto;
  margin-right: auto;
}
@media (max-width: 720px) {
  .message-row { width: 100%; }
}
.load-older {
  margin: 2px auto 12px;
  width: fit-content;
  max-width: 100%;
  border-radius: 4px;
  border: 1px solid var(--line);
  background: var(--bg-elev);
  color: var(--text-3);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 5px 12px;
}

@keyframes chat-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* ─── 欢迎页 ─────────────────────────── */
.welcome {
  user-select: none;
  padding-top: clamp(28px, 10vh, 96px);
  padding-bottom: 32px;
}
@media (min-width: 768px) {
  /* 桌面端: 内容竖直居中 (用 min-h-full + flex 弹性留白) */
  .welcome { justify-content: center; }
}

.welcome-halo {
  position: absolute;
  top: 0;
  left: 50%;
  width: min(420px, 90vw);
  height: 420px;
  transform: translateX(-50%);
  background:
    radial-gradient(circle, rgba(0, 229, 255, 0.14) 0%, transparent 58%),
    repeating-linear-gradient(90deg, transparent 0 18px, rgba(0, 229, 255, 0.05) 18px 19px);
  filter: blur(20px);
  pointer-events: none;
  z-index: 0;
}

.welcome > *:not(.welcome-halo) { position: relative; z-index: 1; }

.welcome-mark {
  margin-bottom: 14px;
  border: 1px solid rgba(0, 229, 255, .28);
  background: rgba(0, 229, 255, .07);
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
  padding: 8px 12px;
  border-radius: 4px;
}

.welcome-greeting {
  font-family: var(--font-mono);
  font-size: clamp(28px, 5vw, 48px);
  font-weight: 800;
  letter-spacing: 0;
  color: var(--text);
  margin: 0 0 6px;
}
.welcome-sub {
  font-size: 14px;
  color: var(--text-2);
  margin: 0 0 24px;
}

.welcome-suggests {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 460px;
  margin-bottom: 28px;
}
@media (max-width: 520px) {
  .welcome-suggests { grid-template-columns: 1fr; }
}

.welcome-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--bg-card);
  border: 1px solid var(--line);
  border-radius: 6px;
  text-align: left;
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
  transition: transform 0.12s, border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.welcome-chip:hover {
  border-color: rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.08);
  transform: translateY(-1px);
  box-shadow: 0 10px 24px -14px rgba(0, 229, 255, 0.55);
}
.welcome-chip .msi {
  font-family: 'Material Symbols Outlined';
  font-size: 20px;
  color: var(--accent);
  flex: none;
}

.welcome-tip {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: .08em;
  color: var(--text-3);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
