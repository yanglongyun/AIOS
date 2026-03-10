<template>
  <section class="space-y-2">
    <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{{ t('instruction_title') }}</span>
    <p class="text-[11px] text-neutral-400">{{ t('instruction_hint') }}</p>
    <textarea
      :value="prompt"
      @input="$emit('update:prompt', $event.target.value)"
      rows="12"
      class="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-800 dark:text-neutral-200 resize-y focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
    />
    <div class="pt-2 flex justify-end">
      <button @click="$emit('save')" class="px-4 py-2 bg-neutral-800 dark:bg-neutral-200 hover:opacity-80 rounded-lg text-sm text-white dark:text-neutral-900 cursor-pointer transition-opacity">{{ t('common_save') }}</button>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '../../i18n/index.js';
const { t } = useI18n();
defineProps({
  prompt: { type: String, default: '' }
});

defineEmits(['update:prompt', 'save']);
</script>
