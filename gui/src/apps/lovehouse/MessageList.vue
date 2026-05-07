<script setup>
import { nextTick, ref, watch } from 'vue';

const props = defineProps({
  messages: { type: Array, default: () => [] },
  sending:  { type: Boolean, default: false }
});

const scrollEl = ref(null);
const scrollEnd = () => {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight;
  });
};

watch(() => props.messages.length, scrollEnd);
watch(() => props.sending, scrollEnd);

defineExpose({ scrollEnd });
</script>

<template>
  <div ref="scrollEl" class="ml-scroll">
    <!-- 漂浮的小爱心装饰 -->
    <div class="hearts">
      <span class="heart h1">♡</span>
      <span class="heart h2">♥</span>
      <span class="heart h3">♡</span>
      <span class="heart h4">♥</span>
    </div>

    <div v-if="!messages.length" class="ml-empty">
      <div class="empty-card">
        <div class="empty-icon">🌸</div>
        <div class="empty-title">小桃在等你说话…</div>
        <div class="empty-hint">
          每一句回复, 你都能看到 <span class="hi">ta 的内心想法</span>
        </div>
        <div class="empty-suggests">
          <span class="suggest">在干嘛呀</span>
          <span class="suggest">想我了吗 ♡</span>
          <span class="suggest">今天心情怎么样</span>
        </div>
      </div>
    </div>

    <template v-for="msg in messages" :key="msg.id">
      <!-- 用户气泡 -->
      <div v-if="msg.role === 'user'" class="row row-user">
        <div class="bubble bubble-user">{{ msg.content }}</div>
      </div>

      <!-- AI: 内心想法 + 公开回复 -->
      <div v-else class="row row-ai">
        <div class="ai-avatar">🌸</div>
        <div class="ai-wrap">
          <div v-if="msg.thought" class="thought">
            <span class="thought-tag">
              <span class="msi">psychology</span>
              <span>内心 OS</span>
            </span>
            <span class="thought-text">{{ msg.thought }}</span>
          </div>
          <div class="bubble bubble-ai">
            <span class="bubble-text">{{ msg.content }}</span>
            <span v-if="msg.mood" class="mood-tag">{{ msg.mood }}</span>
          </div>
        </div>
      </div>
    </template>

    <div v-if="sending" class="row row-ai">
      <div class="ai-avatar">🌸</div>
      <div class="ai-wrap">
        <div class="bubble bubble-ai typing">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ml-scroll {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 18px 12px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.ml-scroll::-webkit-scrollbar { width: 6px; }
.ml-scroll::-webkit-scrollbar-thumb { background: rgba(236, 64, 122, 0.15); border-radius: 3px; }

/* ─── 飘动爱心 ──────────────────────────── */
.hearts {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.heart {
  position: absolute;
  color: rgba(236, 64, 122, 0.18);
  font-size: 18px;
  animation: float 14s linear infinite;
}
.h1 { left: 8%;  top: 100%; animation-delay: 0s;  }
.h2 { left: 32%; top: 100%; animation-delay: -4s; font-size: 14px; }
.h3 { left: 62%; top: 100%; animation-delay: -8s; font-size: 22px; }
.h4 { left: 86%; top: 100%; animation-delay: -11s;}
@keyframes float {
  0%   { transform: translateY(0)    rotate(0deg);   opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(-120vh) rotate(40deg); opacity: 0; }
}

/* ─── 空态 ──────────────────────────────── */
.ml-empty {
  margin: auto;
  z-index: 1;
}
.empty-card {
  text-align: center;
  padding: 32px 28px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(236, 64, 122, 0.12);
  border-radius: 28px;
  box-shadow:
    0 12px 40px -8px rgba(236, 64, 122, 0.18),
    0 2px 8px rgba(236, 64, 122, 0.06);
  max-width: 320px;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  filter: drop-shadow(0 4px 12px rgba(236, 64, 122, 0.3));
  animation: bob 3s ease-in-out infinite;
}
@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.empty-title {
  font-size: 17px;
  font-weight: 600;
  color: #5d2c3e;
  margin-bottom: 6px;
}
.empty-hint {
  font-size: 13px;
  color: #b07a8a;
  margin-bottom: 18px;
  line-height: 1.6;
}
.empty-hint .hi { color: #ec407a; font-weight: 500; }
.empty-suggests {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
.suggest {
  padding: 6px 14px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffe0ec 0%, #ffc4d6 100%);
  color: #c2185b;
  font-size: 13px;
  border: 1px solid rgba(255,255,255,0.8);
  box-shadow: 0 2px 6px rgba(236, 64, 122, 0.12);
}

/* ─── 行 / 头像 ─────────────────────────── */
.row { display: flex; gap: 8px; position: relative; z-index: 1; }
.row-user { justify-content: flex-end; }
.row-ai { justify-content: flex-start; align-items: flex-end; }

.ai-avatar {
  flex: none;
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffe0ec 0%, #ffc4d6 100%);
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(236, 64, 122, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-bottom: 2px;
}

.ai-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: calc(100% - 56px);
}

/* ─── 气泡 ──────────────────────────────── */
.bubble {
  padding: 11px 16px;
  font-size: 15px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
  position: relative;
}

.bubble-user {
  align-self: flex-end;
  max-width: 78%;
  background: linear-gradient(135deg, #ff8fab 0%, #ec407a 100%);
  color: #fff;
  border-radius: 22px 22px 6px 22px;
  box-shadow:
    0 6px 18px -4px rgba(236, 64, 122, 0.4),
    inset 0 1px 0 rgba(255,255,255,0.25);
  text-shadow: 0 1px 2px rgba(0,0,0,0.08);
}

.bubble-ai {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  color: #4a2030;
  border-radius: 22px 22px 22px 6px;
  border: 1px solid rgba(236, 64, 122, 0.1);
  box-shadow:
    0 4px 14px -4px rgba(236, 64, 122, 0.18),
    0 1px 0 rgba(255,255,255,0.6) inset;
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.bubble-text { display: inline; }

/* ─── 内心想法 ──────────────────────────── */
.thought {
  position: relative;
  padding: 10px 14px 10px 16px;
  background:
    linear-gradient(135deg, rgba(255, 240, 246, 0.6) 0%, rgba(255, 228, 236, 0.4) 100%);
  border: 1px dashed rgba(236, 64, 122, 0.35);
  border-radius: 18px 18px 18px 4px;
  font-size: 13px;
  line-height: 1.6;
  color: #8e3a5a;
  font-style: italic;
  letter-spacing: 0.01em;
}
.thought::before {
  content: "";
  position: absolute;
  left: 14px; bottom: -7px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: rgba(255, 228, 236, 0.6);
  border: 1px dashed rgba(236, 64, 122, 0.35);
}
.thought-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  margin-right: 6px;
  background: rgba(236, 64, 122, 0.12);
  color: #ec407a;
  font-size: 11px;
  font-style: normal;
  font-weight: 500;
  border-radius: 999px;
  vertical-align: 1px;
}
.thought-tag .msi {
  font-family: 'Material Symbols Outlined';
  font-size: 13px;
}
.thought-text { color: #8e3a5a; }

/* ─── 情绪 chip ────────────────────────── */
.mood-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 11px;
  font-style: normal;
  font-weight: 500;
  background: linear-gradient(135deg, #ffd6e3 0%, #ffb6c8 100%);
  color: #ad1457;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.7);
  box-shadow: 0 2px 4px rgba(236, 64, 122, 0.15);
  white-space: nowrap;
}

/* ─── 打字指示器 ────────────────────────── */
.typing {
  display: inline-flex;
  gap: 5px;
  padding: 14px 16px;
}
.typing .dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff8fab, #ec407a);
  animation: blink 1.2s infinite;
}
.typing .dot:nth-child(2) { animation-delay: 0.2s; }
.typing .dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink {
  0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-3px); }
}
</style>
