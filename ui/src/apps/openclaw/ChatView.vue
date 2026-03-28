<template>
  <div class="flex flex-1 min-h-0 flex-col">
    <div class="flex-1 min-h-0 overflow-y-auto px-4 py-3 scrollbar-hide" ref="msgBox">
      <div v-if="!messages.length" class="py-12 text-center text-xs text-[rgba(255,230,180,0.25)]">__T_OPENCLAW_CHAT_EMPTY__</div>
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
        <div class="py-2 text-[13px] text-[rgba(255,230,180,0.4)]">__T_OPENCLAW_THINKING__<span class="animate-pulse">...</span></div>
      </div>
    </div>
    <div class="input-tray shrink-0 px-4 pb-3 pt-2.5">
      <form @submit.prevent="send" class="input-well flex items-center gap-2 rounded-lg p-1.5">
        <input v-model="input" placeholder="__T_OPENCLAW_CHAT_PH__" :disabled="busy"
          class="chat-input min-w-0 flex-1 rounded-md px-3.5 py-2 text-[13px] outline-none disabled:opacity-50 font-['Georgia','PingFang_SC',serif]" />
        <button type="submit" :disabled="!input.trim() || busy"
          class="send-btn flex items-center justify-center w-9 h-9 rounded-md text-[14px] font-bold text-[#3a2008] disabled:opacity-30 cursor-pointer shrink-0">↑</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
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
/* 输入栏托盘 — 皮革质感 */
.input-tray {
  background: linear-gradient(180deg, rgba(50,35,20,0.4), rgba(40,28,16,0.6));
  border-top: 1px solid rgba(0,0,0,0.2);
  box-shadow: 0 -1px 0 rgba(255,220,150,0.03);
}
/* 输入凹槽 */
.input-well {
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(80,60,30,0.3);
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,220,150,0.02);
}
/* 输入框 */
.chat-input {
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(100,80,40,0.15);
  color: rgba(220,200,160,0.85);
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
}
.chat-input::placeholder { color:rgba(160,140,100,0.25); }
.chat-input:focus { border-color:rgba(200,160,80,0.35); box-shadow: inset 0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(200,160,80,0.1); }
/* 发送按钮 — 黄铜圆形 */
.send-btn {
  background: linear-gradient(180deg, #d8b868, #b89838, #a08028);
  border: 1px solid #8a6a20;
  box-shadow: 0 2px 0 rgba(60,30,0,0.4), inset 0 1px 1px rgba(255,255,200,0.3);
  text-shadow: 0 1px 0 rgba(255,230,160,0.3);
  transition: all 0.08s;
  position: relative; top: 0;
}
.send-btn:active { top: 2px; box-shadow: 0 0 0 rgba(60,30,0,0.3), inset 0 1px 2px rgba(0,0,0,0.2); }
.send-btn:hover { background: linear-gradient(180deg, #e0c878, #c8a848, #b09038); }
</style>
