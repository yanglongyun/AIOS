<template>
  <section class="space-y-3">
    <!-- 截断设置 -->
    <div class="rounded-[13px] border px-4 py-4" style="background:#fff;border-color:rgba(0,0,0,0.08)">
      <label class="flex cursor-pointer items-center gap-2.5">
        <input
          type="checkbox"
          :checked="enableToolResultTruncate"
          class="h-[15px] w-[15px] shrink-0 cursor-pointer accent-[#5c4332]"
          @change="$emit('update:enable-tool-result-truncate', $event.target.checked)"
        />
        <span class="text-[13px] font-medium" style="color:#2a1f13">__T_SETTINGS_TOOL_TRUNCATE_ENABLE__</span>
      </label>
      <div class="mt-3.5 flex flex-wrap items-center gap-3">
        <span class="text-[12px]" style="color:rgba(0,0,0,0.4)">__T_SETTINGS_TOOL_MAX_CHARS__</span>
        <input
          :value="toolResultMaxChars"
          type="number"
          min="1000"
          max="50000"
          step="1000"
          :disabled="!enableToolResultTruncate"
          class="w-[100px] rounded-[8px] border bg-[#faf8f5] px-2.5 py-1.5 text-[13px] outline-none transition-colors focus:border-[#a07850] focus:bg-white disabled:opacity-40"
          style="border-color:rgba(0,0,0,0.1);color:#2a1f13"
          @input="$emit('update:tool-result-max-chars', Number($event.target.value || 0))"
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
          class="h-[15px] w-[15px] shrink-0 cursor-pointer accent-[#5c4332]"
          @change="$emit('update:enable-tool-loop-limit', $event.target.checked)"
        />
        <span class="text-[13px] font-medium" style="color:#2a1f13">__T_SETTINGS_TOOL_LOOP_LIMIT_ENABLE__</span>
      </label>
      <div class="mt-3.5 flex flex-wrap items-center gap-3">
        <span class="text-[12px]" style="color:rgba(0,0,0,0.4)">__T_SETTINGS_TOOL_MAX_ROUNDS__</span>
        <input
          :value="toolMaxRounds"
          type="number"
          min="1"
          max="500"
          step="1"
          :disabled="!enableToolLoopLimit"
          class="w-[100px] rounded-[8px] border bg-[#faf8f5] px-2.5 py-1.5 text-[13px] outline-none transition-colors focus:border-[#a07850] focus:bg-white disabled:opacity-40"
          style="border-color:rgba(0,0,0,0.1);color:#2a1f13"
          @input="$emit('update:tool-max-rounds', Number($event.target.value || 0))"
        />
      </div>
      <div class="mt-1.5 text-[11px]" style="color:rgba(0,0,0,0.3)">__T_SETTINGS_TOOL_MAX_ROUNDS_HINT__</div>
    </div>

    <div class="flex justify-end pt-1">
      <button
        class="rounded-[9px] bg-[#5c4332] px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#3d2a1e]"
        @click="$emit('save')"
      >__T_COMMON_SAVE__</button>
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
