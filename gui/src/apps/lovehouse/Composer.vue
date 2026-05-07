<script setup>
import { nextTick, ref, watch } from 'vue';

const props = defineProps({
  sending: { type: Boolean, default: false }
});
const emit = defineEmits(['send']);

const textareaEl = ref(null);
const text = ref('');
const composing = ref(false);

const autoResize = () => {
  const el = textareaEl.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
};

const onEnter = (e) => {
  if (composing.value || e.isComposing || e.keyCode === 229) return;
  if (e.shiftKey) return;
  e.preventDefault();
  send();
};

const send = () => {
  const v = text.value.trim();
  if (!v || props.sending) return;
  emit('send', v);
  text.value = '';
  nextTick(() => { if (textareaEl.value) textareaEl.value.style.height = 'auto'; });
};

watch(text, autoResize);
</script>

<template>
  <div class="composer">
    <div class="composer-inner">
      <span class="prefix-icon">✿</span>
      <textarea
        ref="textareaEl"
        v-model="text"
        rows="1"
        placeholder="悄悄说点什么…"
        :disabled="sending"
        @keydown.enter="onEnter"
        @compositionstart="composing = true"
        @compositionend="composing = false" />
      <button
        class="send-btn"
        :class="{ active: text.trim() && !sending }"
        :disabled="sending || !text.trim()"
        @click="send"
        aria-label="发送">
        <span class="msi">favorite</span>
      </button>
    </div>
    <div class="composer-tip">Enter 发送 · Shift+Enter 换行</div>
  </div>
</template>

<style scoped>
.composer {
  position: relative;
  z-index: 2;
  flex: none;
  padding: 10px 14px 14px;
  background:
    linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,245,250,0.85) 30%, rgba(255,245,250,0.95) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.composer-inner {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 6px 6px 6px 14px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(236, 64, 122, 0.12);
  border-radius: 26px;
  box-shadow:
    0 8px 24px -8px rgba(236, 64, 122, 0.2),
    0 1px 0 rgba(255,255,255,0.8) inset;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.composer-inner:focus-within {
  border-color: rgba(236, 64, 122, 0.45);
  box-shadow:
    0 8px 28px -6px rgba(236, 64, 122, 0.32),
    0 0 0 4px rgba(236, 64, 122, 0.08);
}

.prefix-icon {
  flex: none;
  font-size: 18px;
  color: #ec407a;
  padding: 8px 0;
  user-select: none;
  filter: drop-shadow(0 1px 2px rgba(236, 64, 122, 0.3));
}

textarea {
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  resize: none;
  max-height: 160px;
  font: inherit;
  font-size: 15px;
  line-height: 1.55;
  color: #4a2030;
  padding: 8px 0;
}
textarea::placeholder { color: rgba(176, 122, 138, 0.7); }

.send-btn {
  flex: none;
  width: 38px; height: 38px;
  border-radius: 50%;
  border: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffc4d6 0%, #ff8fab 100%);
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
  box-shadow: 0 2px 6px rgba(236, 64, 122, 0.2);
}
.send-btn.active {
  background: linear-gradient(135deg, #ff8fab 0%, #ec407a 100%);
  box-shadow:
    0 6px 16px -2px rgba(236, 64, 122, 0.5),
    0 0 0 3px rgba(236, 64, 122, 0.12);
  animation: heartbeat 1.6s ease-in-out infinite;
}
.send-btn.active:hover { transform: scale(1.1); }
.send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.send-btn .msi {
  font-family: 'Material Symbols Outlined';
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24;
  font-size: 18px;
}
@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.1); }
  30% { transform: scale(1); }
  45% { transform: scale(1.08); }
  60% { transform: scale(1); }
}

.composer-tip {
  text-align: center;
  font-size: 11px;
  color: rgba(176, 122, 138, 0.55);
  margin-top: 6px;
  letter-spacing: 0.04em;
}

@media (max-width: 720px) {
  .composer { padding: 8px 10px 10px; }
  .composer-tip { display: none; }
}
</style>
