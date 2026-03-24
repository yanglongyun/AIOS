<template>
  <section class="space-y-3">
    <div class="rounded-xl border border-[#dcd0b8] bg-[#fffdf8] p-4 dark:border-[#2a1e14] dark:bg-[rgba(30,22,14,0.4)]">
      <label class="flex items-center gap-2 text-[13px] text-[#4a3a28] cursor-pointer dark:text-[#c8b898]">
        <input
          type="checkbox"
          :checked="enableToolResultTruncate"
          @change="$emit('update:enable-tool-result-truncate', $event.target.checked)"
          class="cursor-pointer accent-[#c8a060]"
        />
        {{ t('settings_tool_truncate_enable') }}
      </label>
      <div class="mt-3 flex items-center gap-3">
        <span class="text-xs text-[#a0907a] dark:text-[#6a5840]">{{ t('settings_tool_max_chars') }}</span>
        <input
          :value="toolResultMaxChars"
          @input="$emit('update:tool-result-max-chars', Number($event.target.value || 0))"
          type="number"
          min="1000"
          max="50000"
          step="1000"
          :disabled="!enableToolResultTruncate"
          class="w-28 rounded-lg border border-[#dcd0b8] bg-[#f5f0e8] px-2.5 py-1.5 text-xs text-[#4a3a28] outline-none focus:border-[#b08a40] disabled:opacity-40 transition-colors dark:border-[#2a1e14] dark:bg-[rgba(30,22,14,0.8)] dark:text-[#e8dcc8] dark:focus:border-[#c8a060]"
        />
      </div>
      <div class="mt-1.5 text-[11px] text-[#c0b098] dark:text-[#5a4a30]">{{ t('settings_tool_max_chars_hint') }}</div>
    </div>

    <div class="rounded-xl border border-[#dcd0b8] bg-[#fffdf8] p-4 dark:border-[#2a1e14] dark:bg-[rgba(30,22,14,0.4)]">
      <label class="flex items-center gap-2 text-[13px] text-[#4a3a28] cursor-pointer dark:text-[#c8b898]">
        <input
          type="checkbox"
          :checked="enableToolLoopLimit"
          @change="$emit('update:enable-tool-loop-limit', $event.target.checked)"
          class="cursor-pointer accent-[#c8a060]"
        />
        {{ t('settings_tool_loop_limit_enable') }}
      </label>
      <div class="mt-3 flex items-center gap-3">
        <span class="text-xs text-[#a0907a] dark:text-[#6a5840]">{{ t('settings_tool_max_rounds') }}</span>
        <input
          :value="toolMaxRounds"
          @input="$emit('update:tool-max-rounds', Number($event.target.value || 0))"
          type="number"
          min="1"
          max="500"
          step="1"
          :disabled="!enableToolLoopLimit"
          class="w-28 rounded-lg border border-[#dcd0b8] bg-[#f5f0e8] px-2.5 py-1.5 text-xs text-[#4a3a28] outline-none focus:border-[#b08a40] disabled:opacity-40 transition-colors dark:border-[#2a1e14] dark:bg-[rgba(30,22,14,0.8)] dark:text-[#e8dcc8] dark:focus:border-[#c8a060]"
        />
      </div>
      <div class="mt-1.5 text-[11px] text-[#c0b098] dark:text-[#5a4a30]">{{ t('settings_tool_max_rounds_hint') }}</div>
    </div>

    <div class="pt-2 flex justify-start">
      <button @click="$emit('save')" class="px-5 py-2 rounded-lg text-[13px] font-semibold bg-gradient-to-br from-[#c8a060] to-[#a07840] text-[#1a1410] cursor-pointer hover:opacity-85 transition-opacity">{{ t('common_save') }}</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from '../../i18n/index.ts';
const { t } = useI18n();
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
