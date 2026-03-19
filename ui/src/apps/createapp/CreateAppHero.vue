<template>
  <div class="mb-7 text-center">
    <div class="mb-5 text-5xl">🚀</div>
    <h1 class="mb-3 text-[22px] font-bold text-[#5a4a38]">{{ t('createapp_title') }}</h1>
    <p class="text-sm leading-6 text-[#a0907a]">{{ t('createapp_subtitle') }}</p>
  </div>
</template>

<script setup>
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();
</script>
