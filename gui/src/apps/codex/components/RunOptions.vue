<script setup>
defineProps({
  modes: { type: Array, default: () => [] },
  mode: { type: String, default: "workspace" },
  cwd: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
});

defineEmits(["update:mode", "update:cwd"]);
</script>

<template>
  <section class="run-options">
    <div class="segmented">
      <button
        v-for="item in modes"
        :key="item.id"
        :class="{ active: item.id === mode }"
        :disabled="disabled"
        @click="$emit('update:mode', item.id)">
        {{ item.name }}
      </button>
    </div>
    <label>
      <span>工作区</span>
      <input
        :value="cwd"
        :disabled="disabled"
        @input="$emit('update:cwd', $event.target.value)" />
    </label>
  </section>
</template>

<style scoped>
.run-options {
  flex: none; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 12px;
  align-items: end; padding: 12px 18px; background: #fff; border-bottom: 1px solid #dfe5eb;
}
.segmented {
  display: inline-grid; grid-auto-flow: column; gap: 2px; padding: 4px; border-radius: 999px; background: #eef3f7;
}
.segmented button {
  min-width: 64px; height: 34px; border: 0; border-radius: 999px; background: transparent; color: #5f6b77;
  cursor: pointer; font: inherit; font-size: 13px; font-weight: 650;
}
.segmented button.active { background: #fff; color: #174ea6; box-shadow: 0 1px 4px rgba(31,35,40,.12); }
.segmented button:disabled { opacity: .55; cursor: default; }
label { min-width: 0; display: grid; gap: 5px; }
label span { color: #6b7280; font-size: 12px; font-weight: 650; }
input {
  width: 100%; height: 36px; border: 1px solid #d8dee4; border-radius: 8px; padding: 0 10px;
  background: #fbfcfd; color: #202124; outline: 0; font: inherit;
}
input:focus { border-color: #276ef1; box-shadow: 0 0 0 3px rgba(39,110,241,.12); background: #fff; }
@media (max-width: 760px) {
  .run-options { grid-template-columns: 1fr; padding: 10px; }
  .segmented { width: 100%; grid-template-columns: repeat(3, 1fr); grid-auto-flow: initial; }
}
</style>
