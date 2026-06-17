<script setup>
import { computed, defineAsyncComponent, inject, watch } from 'vue';
import { apps, getApp } from '../apps/registry.js';
import { t } from '../lib/locale.js';

const props = defineProps({
  appId: { type: String, default: '' },
});
defineEmits(['open-app']);

const setPageNav = inject('pageNav');
const activeApp = computed(() => getApp(props.appId));
const activeComponent = computed(() => activeApp.value ? defineAsyncComponent(activeApp.value.load) : null);

watch(activeApp, () => {
  setPageNav(activeApp.value?.name || t('nav_app', 'Apps'), null, null, null);
}, { immediate: true });
</script>

<template>
  <section class="h-full min-h-0 overflow-hidden">
    <component :is="activeComponent" v-if="activeComponent" />
    <div v-else class="h-full overflow-y-auto px-6 pb-7 pt-[18px]">
      <div class="mx-auto max-w-[780px]">
        <p class="mb-3 max-w-[640px] text-[12px] leading-[1.5] text-[var(--muted)]">{{ t('page_desc_apps', 'Apps are focused workspaces built into the agent for specific tasks.') }}</p>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
          <button
            v-for="app in apps"
            :key="app.id"
            class="flex min-h-[92px] items-center gap-3 rounded-xl border border-[var(--line2)] bg-white p-3.5 text-left shadow-card transition-colors hover:border-[var(--accent)]"
            type="button"
            @click="$emit('open-app', app.id)"
          >
            <span class="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-[#eef4fe] text-[22px]">{{ app.icon }}</span>
            <b class="text-sm font-semibold text-[var(--ink)]">{{ app.name }}</b>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
