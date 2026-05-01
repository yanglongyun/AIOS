<template>
  <section>
    <!-- 截断设置 -->
    <div class="py-1">
      <label class="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          :checked="enableToolResultTruncate"
          class="h-[15px] w-[15px] flex-none cursor-pointer"
          style="accent-color:var(--color-accent)"
          @change="$emit('update:enable-tool-result-truncate', $event.target.checked)"
        />
        <span class="text-[13px] font-medium text-ink">__T_SETTINGS_ENABLE_TOOL_TRUNCATE__</span>
      </label>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <span class="text-[12px] text-muted">__T_SETTINGS_TOOL_RESULT_MAX__</span>
        <input
          :value="toolResultMaxChars"
          type="number"
          min="1000" max="50000" step="1000"
          :disabled="!enableToolResultTruncate"
          class="num-input"
          @input="$emit('update:tool-result-max-chars', Number($event.target.value || 0))"
        />
      </div>
      <div class="mt-1.5 text-[11px] text-faint">__T_SETTINGS_TOOL_RESULT_HINT__</div>
    </div>

    <div class="my-4 h-px bg-line"></div>

    <!-- 循环限制 -->
    <div class="py-1">
      <label class="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          :checked="enableToolLoopLimit"
          class="h-[15px] w-[15px] flex-none cursor-pointer"
          style="accent-color:var(--color-accent)"
          @change="$emit('update:enable-tool-loop-limit', $event.target.checked)"
        />
        <span class="text-[13px] font-medium text-ink">__T_SETTINGS_ENABLE_TOOL_LOOP_LIMIT__</span>
      </label>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <span class="text-[12px] text-muted">__T_SETTINGS_TOOL_MAX_ROUNDS__</span>
        <input
          :value="toolMaxRounds"
          type="number"
          min="1" max="500" step="1"
          :disabled="!enableToolLoopLimit"
          class="num-input"
          @input="$emit('update:tool-max-rounds', Number($event.target.value || 0))"
        />
      </div>
      <div class="mt-1.5 text-[11px] text-faint">__T_SETTINGS_TOOL_ROUNDS_HINT__</div>
    </div>

    <div class="flex justify-end pt-2">
      <button class="save-btn" @click="$emit('save')">__T_COMMON_SAVE__</button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  enableToolResultTruncate: { type: Boolean, default: true },
  toolResultMaxChars: { type: Number, default: 12000 },
  enableToolLoopLimit: { type: Boolean, default: true },
  toolMaxRounds: { type: Number, default: 50 }
});
defineEmits([
  'update:enable-tool-result-truncate',
  'update:tool-result-max-chars',
  'update:enable-tool-loop-limit',
  'update:tool-max-rounds',
  'save'
]);
</script>

<style scoped>
.num-input {
    width: 100px;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid var(--color-line-hi);
    background: var(--color-bg);
    color: var(--color-ink);
    font-size: 13px;
    outline: 0;
    transition: border-color .15s;
}
.num-input:focus { border-color: var(--color-accent); }
.num-input:disabled { opacity: 0.4; }
</style>
