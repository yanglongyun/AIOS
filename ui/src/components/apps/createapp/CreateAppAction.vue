<template>
  <button
    class="rounded-xl bg-[#5a3e28] px-7 py-2.5 text-sm text-[#f0e8d8] shadow-[0_2px_8px_rgba(90,62,40,0.3)] transition-opacity hover:opacity-90"
    @click="$emit('open-chat')"
  >
    {{ t('createapp_button') }}
  </button>
</template>

<script setup>
import { useI18n } from '../../../i18n/index.js';

defineEmits(['open-chat']);
const { t } = useI18n();
</script>
