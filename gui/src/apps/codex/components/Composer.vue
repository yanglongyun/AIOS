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
  flex: none; display: flex; align-items: end; gap: 10px; padding: 14px 18px 18px;
  border-top: 1px solid #dfe5eb; background: #fff;
}
textarea {
  flex: 1; min-height: 48px; max-height: 180px; resize: vertical; border: 1px solid #d8dee4;
  border-radius: 12px; padding: 11px 13px; outline: 0; font: inherit; line-height: 1.5;
}
textarea:focus { border-color: #276ef1; box-shadow: 0 0 0 3px rgba(39,110,241,.12); }
button {
  width: 46px; height: 46px; border: 0; border-radius: 999px; background: #276ef1; color: #fff;
  cursor: pointer; display: grid; place-items: center;
}
button:disabled { opacity: .48; cursor: default; }
@media (max-width: 760px) {
  .composer { padding: 10px; }
}
</style>
