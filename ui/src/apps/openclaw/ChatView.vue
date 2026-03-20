<template>
  <div class="flex flex-1 min-h-0 flex-col">
    <div class="flex-1 min-h-0 overflow-y-auto px-4 py-3 scrollbar-hide" ref="msgBox">
      <div v-if="!messages.length" class="py-12 text-center text-xs text-[rgba(255,230,180,0.25)]">{{ t('openclaw_chat_empty') }}</div>
      <div v-for="(m, i) in messages" :key="i" class="mb-3">
        <div v-if="m.role === 'user'" class="flex justify-end">
          <div class="msg-user max-w-[80%] rounded-[14px_14px_4px_14px] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#f0e8d8]">{{ m.content }}</div>
        </div>
        <div v-else class="flex items-start gap-2">
          <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px] msg-avatar">🦞</div>
          <div class="msg-bot max-w-[80%] whitespace-pre-wrap rounded-[14px_14px_14px_4px] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#d0c0a0]">{{ m.content }}</div>
        </div>
      </div>
      <div v-if="busy" class="flex items-start gap-2">
        <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[14px] msg-avatar">🦞</div>
        <div class="py-2 text-[13px] text-[rgba(255,230,180,0.4)]">{{ t('openclaw_thinking') }}<span class="animate-pulse">...</span></div>
      </div>
    </div>
    <div class="shrink-0 px-4 pb-3 pt-2 border-t border-[rgba(200,180,140,0.1)]">
      <form @submit.prevent="send" class="flex gap-2">
        <input v-model="input" :placeholder="t('openclaw_chat_ph')" :disabled="busy"
          class="min-w-0 flex-1 rounded-xl px-4 py-2.5 text-[13px] outline-none disabled:opacity-50 chat-input" />
        <button type="submit" :disabled="!input.trim() || busy"
          class="brass-btn rounded-xl px-5 py-2.5 text-[13px] font-bold text-white border border-[#7a5818] disabled:opacity-40">{{ t('openclaw_send') }}</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();
const API = '/aios/apps/openclaw';

const messages = ref([]);
const input = ref('');
const busy = ref(false);
const msgBox = ref(null);

const scrollBottom = () => nextTick(() => { if (msgBox.value) msgBox.value.scrollTop = msgBox.value.scrollHeight; });

const send = async () => {
  const msg = input.value.trim();
  if (!msg || busy.value) return;
  messages.value.push({ role: 'user', content: msg });
  input.value = '';
  busy.value = true;
  scrollBottom();
  try {
    const res = await fetch(`${API}/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, history: messages.value.slice(0, -1) })
    });
    const data = await res.json();
    messages.value.push({ role: 'assistant', content: data.success ? data.reply : `Error: ${data.message}` });
  } catch (e) { messages.value.push({ role: 'assistant', content: `Error: ${e.message}` }); }
  busy.value = false;
  scrollBottom();
};
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display:none; }
.msg-user { background:linear-gradient(135deg, #5a3828, #3a2018); border:1px solid rgba(100,70,40,0.3); }
.msg-avatar { background:radial-gradient(circle at 42% 38%, #6a4a28, #3a2810); border:1px solid rgba(100,70,40,0.3); }
.msg-bot { background:rgba(0,0,0,0.12); border:1px solid rgba(160,140,100,0.1); }
.chat-input { background:rgba(0,0,0,0.15); border:1px solid rgba(160,140,100,0.15); color:rgba(220,200,160,0.8); font-family:'Georgia','PingFang SC',serif; }
.chat-input::placeholder { color:rgba(160,140,100,0.3); }
.chat-input:focus { border-color:rgba(200,160,80,0.3); }
.brass-btn { background:linear-gradient(180deg,#c8a050,#a07828); text-shadow:0 1px 1px rgba(0,0,0,0.3); box-shadow:0 2px 0 #5a3a08, inset 0 1px 1px rgba(255,230,160,0.2); }
.brass-btn:active { transform:translateY(2px); box-shadow:0 0 0 #5a3a08; }
</style>
