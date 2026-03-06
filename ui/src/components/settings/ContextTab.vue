<template>
  <section class="space-y-3">
    <div class="text-xs font-medium text-[#a0907a] dark:text-[#6a5840]">{{ t('settings_context_rounds') }}</div>
    <div class="flex gap-2">
      <button
        v-for="n in [30, 100, 500]"
        :key="n"
        @click="$emit('update:context-rounds', n)"
        class="flex-1 px-3 py-2.5 rounded-lg text-[13px] cursor-pointer transition-all border"
        :class="contextRounds === n
          ? 'bg-[rgba(90,58,40,0.08)] border-[#b08a40] text-[#5a3e28] font-semibold dark:bg-[rgba(200,160,96,0.12)] dark:border-[#c8a060] dark:text-[#c8a060]'
          : 'border-[#dcd0b8] text-[#b8a888] hover:border-[#c0a878] hover:text-[#7a6a50] dark:border-[#2a1e14] dark:text-[#6a5840] dark:hover:border-[#5a4a30] dark:hover:text-[#a08c70]'"
      >
        {{ n }}
      </button>
    </div>
    <div class="pt-2 flex justify-end">
      <button @click="$emit('save')" class="px-5 py-2 rounded-lg text-[13px] font-semibold bg-gradient-to-br from-[#c8a060] to-[#a07840] text-[#1a1410] cursor-pointer hover:opacity-85 transition-opacity">{{ t('common_save') }}</button>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();

defineProps({
  contextRounds: { type: Number, default: 100 }
});

defineEmits(['update:context-rounds', 'save']);
</script>
