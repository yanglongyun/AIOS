<script setup>
defineProps({
  modelValue: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "send"]);

function onKeydown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    emit("send");
  }
}
</script>

<template>
  <div class="composer">
    <textarea
      :value="modelValue"
      :disabled="disabled"
      rows="2"
      placeholder="输入给 Codex 的指令"
      @input="$emit('update:modelValue', $event.target.value)"
      @keydown="onKeydown" />
    <button :disabled="disabled || !modelValue.trim()" @click="$emit('send')">
      <span class="msi">send</span>
    </button>
  </div>
</template>

<style scoped>
.composer {
  flex: none; display: flex; align-items: end; gap: 10px;
  padding: 14px 18px 18px;
  border-top: 1px solid var(--line-soft);
  background: var(--bg);
}
textarea {
  flex: 1; min-height: 48px; max-height: 180px; resize: vertical;
  border: 1px solid var(--line);
  border-radius: 12px; padding: 11px 14px;
  outline: 0;
  font: inherit; line-height: 1.55;
  color: var(--text);
  background: var(--bg);
  transition: border-color .15s, box-shadow .15s, background .15s;
}
textarea::placeholder { color: var(--text-3); }
textarea:hover:not(:disabled) { border-color: var(--color-line-hi, #bdc1c6); }
textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.14);
}
textarea:disabled { background: var(--bg-elev); color: var(--text-3); }
button {
  flex: none;
  width: 44px; height: 44px;
  border: 0; border-radius: 12px;
  background: var(--accent); color: #fff;
  cursor: pointer;
  display: grid; place-items: center;
  box-shadow: var(--shadow-1);
  transition: background .15s, box-shadow .15s, transform .08s;
}
button:hover:not(:disabled) { background: var(--accent-hi); box-shadow: var(--shadow-2); }
button:active:not(:disabled) { transform: translateY(1px); }
button:disabled {
  background: var(--bg-elev); color: var(--text-3);
  box-shadow: none; cursor: default;
}
button .msi { font-size: 20px; }
@media (max-width: 760px) {
  .composer { padding: 10px; }
  button { width: 40px; height: 40px; }
}
</style>
