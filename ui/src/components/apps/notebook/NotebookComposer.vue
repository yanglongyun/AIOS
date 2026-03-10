<template>
  <div class="rounded-lg border border-gray-200 dark:border-neutral-700 p-3">
    <textarea
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @keydown="$emit('keydown', $event)"
      rows="3"
      class="w-full bg-transparent text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 outline-none resize-y"
      :placeholder="t('notebook_composer_placeholder')"
    />
    <div class="mt-2 flex items-center justify-end">
      <button
        @click="$emit('submit')"
        :disabled="creating || !modelValue.trim()"
        class="px-3 py-1.5 text-xs rounded-lg bg-neutral-800 dark:bg-neutral-200 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed text-white dark:text-neutral-900 cursor-pointer transition-opacity"
      >
        {{ t('notebook_record') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '../../../i18n/index.js';
const { t } = useI18n();
defineProps({
  modelValue: { type: String, default: '' },
  creating: { type: Boolean, default: false }
});

defineEmits(['update:modelValue', 'submit', 'keydown']);
</script>
