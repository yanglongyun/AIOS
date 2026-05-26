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
      <h1>{{ emptyTitle }}</h1>
      <p>{{ emptyText }}</p>
    </div>
    <article v-for="message in messages" :key="message.key" :class="cls(message)">
      <div class="bubble">
        <pre>{{ message.text }}</pre>
      </div>
    </article>
    <article v-if="running" class="message event">
      <div class="bubble">
        <pre>运行中…</pre>
      </div>
    </article>
  </div>
</template>

<style scoped>
.messages { flex: 1; min-height: 0; overflow: auto; padding: 22px; display: flex; flex-direction: column; gap: 12px; }
.welcome { margin: auto; max-width: 520px; text-align: center; color: #5f6b77; }
.welcome h1 { margin: 0 0 8px; color: #202124; font-size: 30px; letter-spacing: 0; }
.welcome p { margin: 0; line-height: 1.7; }
.message { display: flex; }
.message.user { justify-content: flex-end; }
.message.assistant, .message.event { justify-content: flex-start; }
.bubble {
  max-width: min(760px, 78%);
  border-radius: 18px; padding: 12px 14px; background: #eef3f8; color: #202124;
}
.user .bubble { background: #276ef1; color: #fff; }
.event .bubble { background: transparent; color: #6b7280; border: 1px solid #dfe5eb; }
pre {
  margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word;
  font: inherit; line-height: 1.65;
}
@media (max-width: 760px) {
  .messages { padding: 14px; }
  .bubble { max-width: 92%; }
}
</style>
