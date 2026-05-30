<script setup>
defineProps({
  messages: { type: Array, default: () => [] },
  running: { type: Boolean, default: false },
  emptyTitle: { type: String, default: "Codex 会话" },
  emptyText: { type: String, default: "连接本机 Codex app-server，直接运行一个真实 Codex 线程。" },
});

function cls(message) {
  return ["message", message.role || "event"];
}
</script>

<template>
  <div class="messages">
    <div v-if="!messages.length" class="welcome">
      <div class="welcome-mark"><span class="msi">terminal</span></div>
      <h1>{{ emptyTitle }}</h1>
      <p>{{ emptyText }}</p>
    </div>
    <article v-for="message in messages" :key="message.key" :class="cls(message)">
      <div class="bubble">
        <pre>{{ message.text }}</pre>
      </div>
    </article>
    <article v-if="running" class="message event">
      <div class="bubble running">
        <i class="cursor" />
        <span>运行中</span>
      </div>
    </article>
  </div>
</template>

<style scoped>
.messages {
  flex: 1; min-height: 0; overflow: auto;
  padding: 24px 22px; display: flex; flex-direction: column; gap: 14px;
}
.welcome {
  margin: auto; max-width: 460px; text-align: center;
  color: var(--text-2);
  display: grid; gap: 14px; justify-items: center;
}
.welcome-mark {
  width: 56px; height: 56px; border-radius: 14px;
  display: grid; place-items: center;
  background: var(--bg-elev);
  color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--line-soft);
}
.welcome-mark .msi { font-size: 30px; }
.welcome h1 {
  margin: 0; color: var(--text);
  font-size: 22px; font-weight: 650; letter-spacing: -0.01em;
}
.welcome p { margin: 0; line-height: 1.7; font-size: 13.5px; }
.message { display: flex; }
.message.user { justify-content: flex-end; }
.message.assistant, .message.event { justify-content: flex-start; }
.bubble {
  max-width: min(760px, 78%);
  border-radius: 14px;
  padding: 11px 14px;
  background: var(--bg-elev);
  color: var(--text);
  box-shadow: inset 0 0 0 1px var(--line-soft);
}
.user .bubble {
  background: var(--accent);
  color: #fff;
  box-shadow: none;
}
.event .bubble {
  background: transparent;
  color: var(--text-2);
  box-shadow: inset 0 0 0 1px var(--line);
  font-family: var(--font-mono);
  font-size: 12.5px;
}
.bubble.running {
  display: inline-flex; align-items: center; gap: 8px;
}
.cursor {
  width: 8px; height: 14px; background: var(--accent);
  display: inline-block; border-radius: 1px;
  animation: blink 1s steps(2, start) infinite;
}
@keyframes blink { to { visibility: hidden; } }
pre {
  margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word;
  font: inherit; line-height: 1.65;
}
.assistant pre, .event pre {
  font-family: var(--font-mono); font-size: 13px; line-height: 1.6;
}
@media (max-width: 760px) {
  .messages { padding: 14px; }
  .bubble { max-width: 92%; }
  .welcome h1 { font-size: 19px; }
}
</style>
