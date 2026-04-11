<template>
  <section class="space-y-3">
    <!-- 截断设置 -->
    <div class="rounded-[13px] border px-4 py-4" style="background:#fff;border-color:rgba(0,0,0,0.08)">
      <label class="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          :checked="enableToolResultTruncate"
          @change="$emit('update:enable-tool-result-truncate', $event.target.checked)"
          class="s-checkbox"
        />
        <span class="text-[13px] font-medium" style="color:#2a1f13">__T_SETTINGS_TOOL_TRUNCATE_ENABLE__</span>
      </label>
      <div class="mt-3.5 flex flex-wrap items-center gap-3">
        <span class="text-[12px]" style="color:rgba(0,0,0,0.4)">__T_SETTINGS_TOOL_MAX_CHARS__</span>
        <input
          :value="toolResultMaxChars"
          @input="$emit('update:tool-result-max-chars', Number($event.target.value || 0))"
          type="number"
          min="1000"
          max="50000"
          step="1000"
          :disabled="!enableToolResultTruncate"
          class="s-number-input"
        />
      </div>
      <div class="mt-1.5 text-[11px]" style="color:rgba(0,0,0,0.3)">__T_SETTINGS_TOOL_MAX_CHARS_HINT__</div>
    </div>

    <!-- 循环限制 -->
    <div class="rounded-[13px] border px-4 py-4" style="background:#fff;border-color:rgba(0,0,0,0.08)">
      <label class="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          :checked="enableToolLoopLimit"
          @change="$emit('update:enable-tool-loop-limit', $event.target.checked)"
          class="s-checkbox"
        />
        <span class="text-[13px] font-medium" style="color:#2a1f13">__T_SETTINGS_TOOL_LOOP_LIMIT_ENABLE__</span>
      </label>
      <div class="mt-3.5 flex flex-wrap items-center gap-3">
        <span class="text-[12px]" style="color:rgba(0,0,0,0.4)">__T_SETTINGS_TOOL_MAX_ROUNDS__</span>
        <input
          :value="toolMaxRounds"
          @input="$emit('update:tool-max-rounds', Number($event.target.value || 0))"
          type="number"
          min="1"
          max="500"
          step="1"
          :disabled="!enableToolLoopLimit"
          class="s-number-input"
        />
      </div>
      <div class="mt-1.5 text-[11px]" style="color:rgba(0,0,0,0.3)">__T_SETTINGS_TOOL_MAX_ROUNDS_HINT__</div>
    </div>

    <div class="flex justify-end pt-1">
      <button @click="$emit('save')" class="s-btn-primary">__T_COMMON_SAVE__</button>
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
.s-checkbox {
  width: 15px;
  height: 15px;
  cursor: pointer;
  accent-color: #5c4332;
  flex-shrink: 0;
}
.s-number-input {
  width: 100px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.1);
  background: #faf8f5;
  font-size: 13px;
  color: #2a1f13;
  outline: none;
  transition: border-color 0.15s;
}
.s-number-input:focus { border-color: #a07850; background: #fff; }
.s-number-input:disabled { opacity: 0.4; }

.s-btn-primary {
  padding: 8px 20px;
  border-radius: 9px;
  background: #5c4332;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s;
}
.s-btn-primary:hover { background: #3d2a1e; }
</style>
