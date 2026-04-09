<template>
  <section class="space-y-3">
    <div class="rounded-xl border border-black/[0.08] bg-white p-4">
      <label class="flex items-center gap-2 text-[13px] text-[#222] cursor-pointer">
        <input
          type="checkbox"
          :checked="enableToolResultTruncate"
          @change="$emit('update:enable-tool-result-truncate', $event.target.checked)"
          class="cursor-pointer accent-black"
        />
        __T_SETTINGS_TOOL_TRUNCATE_ENABLE__
      </label>
      <div class="mt-3 flex items-center gap-3">
        <span class="text-xs text-black/40">__T_SETTINGS_TOOL_MAX_CHARS__</span>
        <input
          :value="toolResultMaxChars"
          @input="$emit('update:tool-result-max-chars', Number($event.target.value || 0))"
          type="number"
          min="1000"
          max="50000"
          step="1000"
          :disabled="!enableToolResultTruncate"
          class="w-28 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs text-[#222] outline-none focus:border-[#222] disabled:opacity-40 transition-colors"
        />
      </div>
      <div class="mt-1.5 text-[11px] text-black/25">__T_SETTINGS_TOOL_MAX_CHARS_HINT__</div>
    </div>

    <div class="rounded-xl border border-black/[0.08] bg-white p-4">
      <label class="flex items-center gap-2 text-[13px] text-[#222] cursor-pointer">
        <input
          type="checkbox"
          :checked="enableToolLoopLimit"
          @change="$emit('update:enable-tool-loop-limit', $event.target.checked)"
          class="cursor-pointer accent-black"
        />
        __T_SETTINGS_TOOL_LOOP_LIMIT_ENABLE__
      </label>
      <div class="mt-3 flex items-center gap-3">
        <span class="text-xs text-black/40">__T_SETTINGS_TOOL_MAX_ROUNDS__</span>
        <input
          :value="toolMaxRounds"
          @input="$emit('update:tool-max-rounds', Number($event.target.value || 0))"
          type="number"
          min="1"
          max="500"
          step="1"
          :disabled="!enableToolLoopLimit"
          class="w-28 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs text-[#222] outline-none focus:border-[#222] disabled:opacity-40 transition-colors"
        />
      </div>
      <div class="mt-1.5 text-[11px] text-black/25">__T_SETTINGS_TOOL_MAX_ROUNDS_HINT__</div>
    </div>

    <div class="pt-2 flex justify-start">
      <button @click="$emit('save')" class="px-5 py-2 rounded-lg text-[13px] font-semibold bg-[#222] text-white cursor-pointer hover:bg-black transition-colors">__T_COMMON_SAVE__</button>
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
