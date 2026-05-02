<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h3 class="m-0 text-[16px] font-semibold text-ink">__T_SETTINGS_CONTEXTS_TITLE__</h3>
        <p class="m-0 mt-1 text-[12px] text-faint">__T_SETTINGS_CONTEXTS_DESC__</p>
      </div>
      <button class="inline-flex items-center gap-1.5 rounded-full border-0 bg-bg-hi px-3 py-2 text-[12.5px] text-muted hover:bg-line-hi hover:text-ink"
        :disabled="loading"
        @click="fetchItems">
        <span class="msi sm" :class="{ spin: loading }">refresh</span>
        <span>__T_COMMON_REFRESH__</span>
      </button>
    </div>

    <div v-if="error" class="rounded-lg px-3 py-2 text-[13px] text-bad"
      style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
      {{ error }}
    </div>

    <div v-if="!items.length && !loading" class="rounded-lg border border-line bg-bg-elev px-4 py-8 text-center text-[13px] text-muted">
      __T_SETTINGS_CONTEXTS_EMPTY__
    </div>

    <div v-else class="flex flex-col gap-2">
      <article v-for="item in items" :key="`${item.source}:${item.sourceId}`"
        class="rounded-lg border border-line bg-bg-elev px-3.5 py-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex min-w-0 items-center gap-2">
              <span class="rounded-md bg-bg-hi px-1.5 py-px text-[10.5px] font-medium uppercase tracking-[0.04em] text-muted">{{ item.source }}</span>
              <h4 class="m-0 truncate text-[14px] font-semibold text-ink">{{ item.title || `${item.source}:${item.sourceId}` }}</h4>
            </div>
            <p v-if="item.summary" class="m-0 mt-1 line-clamp-2 text-[12px] leading-[1.55] text-muted">{{ item.summary }}</p>
          </div>
          <span class="rounded-full px-2 py-0.5 text-[11px] font-medium"
            :class="accessClass(item.access)">
            {{ accessLabel(item.access) }}
          </span>
        </div>
        <div class="mt-2 flex items-center justify-between gap-3 text-[11px] text-faint">
          <span class="font-mono">{{ item.sourceId }}</span>
          <span>{{ item.updatedAt || '' }}</span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const items = ref([]);
const loading = ref(false);
const error = ref('');

const accessLabel = (access) => {
  if (access === 'full') return '__T_SETTINGS_CONTEXTS_FULL__';
  if (access === 'summary') return '__T_SETTINGS_CONTEXTS_SUMMARY__';
  return '__T_SETTINGS_CONTEXTS_NONE__';
};
const accessClass = (access) => {
  if (access === 'full') return 'bg-blue-bg text-blue-fg';
  if (access === 'summary') return 'text-accent bg-bg-hi';
  return 'bg-bg-hi text-faint';
};

const fetchItems = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch('/api/settings/contexts');
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error(data.error || data.message || `${res.status} ${res.statusText}`);
    items.value = data.items || [];
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchItems);
</script>

<style scoped>
.spin { animation: contexts-spin 1s linear infinite; }
@keyframes contexts-spin { to { transform: rotate(360deg); } }
</style>
