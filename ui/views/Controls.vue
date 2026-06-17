<script setup>
import { Globe, Monitor } from '@lucide/vue';
import { inject, onMounted, ref } from 'vue';
import { getControls } from '../lib/api.js';
import { t } from '../lib/locale.js';

const setPageNav = inject('pageNav');
const controls = ref({
  browser: { connected: false, status: 'disconnected', detail: '' },
  computer: { connected: false, status: 'disconnected', detail: '', tools: [], drivers: {} }
});
const loading = ref(false);
const error = ref('');

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    const data = await getControls();
    controls.value = data.controls || controls.value;
  } catch (err) {
    error.value = err.message || t('common_load_failed', 'Load failed');
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  setPageNav(t('nav_controls', 'Controls'), null, null, null);
  await refresh();
});
</script>

<template>
  <section class="h-full overflow-y-auto px-6 pb-7 pt-[18px]">
    <div class="mx-auto max-w-[780px]">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p class="mb-3 max-w-[640px] text-[12px] leading-[1.5] text-[var(--muted)]">{{ t('page_desc_controls', 'Controls shows the current browser and computer control connection state.') }}</p>
        <button type="button" :disabled="loading" @click="refresh">{{ t('common_refresh', 'Refresh') }}</button>
      </div>
      <div v-if="error" class="mb-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3.5 text-left text-[13px] text-[#b91c1c]">{{ error }}</div>
      <div class="grid gap-3">
        <article class="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-[13px] rounded-[10px] border border-[var(--line2)] bg-white p-[15px] shadow-card" :class="{ online: controls.browser.connected }">
          <div class="grid h-[42px] w-[42px] place-items-center rounded-[10px] bg-[#eef4fe] text-[var(--accent-d)] [&>svg]:h-5 [&>svg]:w-5"><Globe /></div>
          <div class="min-w-0 [&>h3]:text-[15px] [&>h3]:font-bold [&>h3]:text-[var(--ink)] [&>p]:mt-1 [&>p]:text-[12.5px] [&>p]:text-[var(--muted)] [&>small]:mt-1 [&>small]:block [&>small]:text-[11.5px] [&>small]:font-semibold [&>small]:text-[var(--accent-d)]">
            <h3>{{ t('controls_browser', 'Browser') }}</h3>
            <p>{{ controls.browser.detail || t('controls_browser_disconnected', 'browser-use connector is not connected') }}</p>
            <small v-if="controls.browser.connected && controls.browser.tools?.length">{{ t('controls_actions_available', '{n} actions available', { n: controls.browser.tools.length }) }}</small>
          </div>
          <span class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f3f3f4] px-2.5 py-1 text-xs font-semibold text-[var(--muted)] [&>i]:h-[7px] [&>i]:w-[7px] [&>i]:rounded-full [&>i]:bg-current"><i></i>{{ controls.browser.connected ? t('common_online', 'Online') : t('common_not_connected', 'Not connected') }}</span>
        </article>

        <article class="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-[13px] rounded-[10px] border border-[var(--line2)] bg-white p-[15px] shadow-card" :class="{ online: controls.computer.connected }">
          <div class="grid h-[42px] w-[42px] place-items-center rounded-[10px] bg-[#eef4fe] text-[var(--accent-d)] [&>svg]:h-5 [&>svg]:w-5"><Monitor /></div>
          <div class="min-w-0 [&>h3]:text-[15px] [&>h3]:font-bold [&>h3]:text-[var(--ink)] [&>p]:mt-1 [&>p]:text-[12.5px] [&>p]:text-[var(--muted)] [&>small]:mt-1 [&>small]:block [&>small]:text-[11.5px] [&>small]:font-semibold [&>small]:text-[var(--accent-d)]">
            <h3>{{ t('controls_computer', 'Computer') }}</h3>
            <p>{{ controls.computer.detail || t('controls_computer_disconnected', 'computer-use connector is not connected') }}</p>
            <small v-if="controls.computer.tools?.length">{{ t('controls_actions_available', '{n} actions available', { n: controls.computer.tools.length }) }}</small>
          </div>
          <span class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f3f3f4] px-2.5 py-1 text-xs font-semibold text-[var(--muted)] [&>i]:h-[7px] [&>i]:w-[7px] [&>i]:rounded-full [&>i]:bg-current"><i></i>{{ controls.computer.connected ? t('common_online', 'Online') : t('common_not_connected', 'Not connected') }}</span>
        </article>
      </div>
    </div>
  </section>
</template>
