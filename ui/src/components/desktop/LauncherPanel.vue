<template>
  <div
    class="absolute bottom-[52px] left-2 z-[201] w-[300px] rounded-[14px] border border-[rgba(212,192,160,0.5)] bg-[rgba(255,252,248,0.97)] p-3 shadow-[0_8px_36px_rgba(90,62,40,0.18)] backdrop-blur-xl"
    @click.stop
  >
    <div class="mb-2.5 flex items-center gap-1.5">
      <input
        ref="searchEl"
        v-model="search"
        class="min-w-0 flex-1 rounded-[8px] border border-[rgba(200,160,96,0.3)] bg-[rgba(245,240,232,0.9)] px-3 py-1.5 text-[13px] text-[#3a2a18] outline-none placeholder-[#b0a090] focus:border-[#c8a060]"
        :placeholder="t('launcher_search')"
      />
      <button
        class="flex h-[32px] flex-shrink-0 items-center gap-1 rounded-[8px] bg-[rgba(200,160,96,0.18)] px-2.5 text-[12px] font-medium text-[#5a3e28] transition-colors hover:bg-[rgba(200,160,96,0.3)]"
        @click="$emit('create-app')"
      >
        <span class="text-[14px] leading-none">✦</span>
        {{ t('app_sidebar_create_app') }}
      </button>
    </div>
    <div class="grid grid-cols-4 gap-1.5">
      <button
        v-for="app in filteredApps"
        :key="app.id"
        class="flex flex-col items-center gap-1 rounded-[9px] px-1 py-2.5 transition-colors hover:bg-[rgba(200,160,96,0.1)]"
        @click="$emit('open', app.id)"
      >
        <span class="text-[20px]">{{ app.icon }}</span>
        <span class="text-center text-[10.5px] leading-tight text-[#5a4a38]">{{ t(app.name) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { appRegistry } from '../../desktop/apps.js';
import { useI18n } from '../../i18n/index.js';

const { t } = useI18n();
defineEmits(['open', 'close', 'create-app']);

const search = ref('');
const searchEl = ref(null);

const visibleApps = appRegistry.filter(a => !a.hidden);

const filteredApps = computed(() => {
  if (!search.value.trim()) return visibleApps;
  const q = search.value.toLowerCase();
  return visibleApps.filter(a => t(a.name).toLowerCase().includes(q));
});

onMounted(() => searchEl.value?.focus());
</script>
