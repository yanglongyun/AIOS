<template>
  <section class="space-y-3">
    <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/60">
      <label class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer">
        <input
          type="checkbox"
          :checked="enableToolResultTruncate"
          @change="$emit('update:enable-tool-result-truncate', $event.target.checked)"
          class="cursor-pointer"
        />
        {{ t('settings_tool_truncate_enable') }}
      </label>
      <div class="mt-2 flex items-center gap-2">
        <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ t('settings_tool_max_chars') }}</span>
        <input
          :value="toolResultMaxChars"
          @input="$emit('update:tool-result-max-chars', Number($event.target.value || 0))"
          type="number"
          min="1000"
          max="50000"
          step="1000"
          :disabled="!enableToolResultTruncate"
          class="w-28 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-neutral-800 outline-none focus:border-neutral-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-neutral-500"
        />
      </div>
      <div class="mt-1 text-[11px] text-neutral-400">{{ t('settings_tool_max_chars_hint') }}</div>
    </div>

    <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/60">
      <label class="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200 cursor-pointer">
        <input
          type="checkbox"
          :checked="enableToolLoopLimit"
          @change="$emit('update:enable-tool-loop-limit', $event.target.checked)"
          class="cursor-pointer"
        />
        {{ t('settings_tool_loop_limit_enable') }}
      </label>
      <div class="mt-2 flex items-center gap-2">
        <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ t('settings_tool_max_rounds') }}</span>
        <input
          :value="toolMaxRounds"
          @input="$emit('update:tool-max-rounds', Number($event.target.value || 0))"
          type="number"
          min="1"
          max="500"
          step="1"
          :disabled="!enableToolLoopLimit"
          class="w-28 rounded border border-gray-200 bg-white px-2 py-1 text-xs text-neutral-800 outline-none focus:border-neutral-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-neutral-500"
        />
      </div>
      <div class="mt-1 text-[11px] text-neutral-400">{{ t('settings_tool_max_rounds_hint') }}</div>
    </div>

    <div class="pt-2 flex justify-end">
      <button @click="$emit('save')" class="px-4 py-2 bg-neutral-800 dark:bg-neutral-200 hover:opacity-80 rounded-lg text-sm text-white dark:text-neutral-900 cursor-pointer transition-opacity">{{ t('common_save') }}</button>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '../../i18n/index.js';

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

