<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import NotebookList from './components/NotebookList.vue';
import NotebookEdit from './components/NotebookEdit.vue';

const route = useRoute();

// /app/notebook              → list
// /app/notebook/new          → new note
// /app/notebook/:id (number) → edit existing
const view = computed(() => {
  const p1 = route.params.p1;
  if (!p1) return 'list';
  if (p1 === 'new') return 'edit';
  if (/^\d+$/.test(p1)) return 'edit';
  return 'list';
});
const editId = computed(() => {
  const p1 = route.params.p1;
  if (p1 === 'new' || !p1) return null;
  return /^\d+$/.test(p1) ? Number(p1) : null;
});
</script>

<template>
    <div class="notebook-shell flex h-full flex-col">
        <NotebookList v-if="view === 'list'" />
        <NotebookEdit v-else :note-id="editId" :key="route.fullPath" />
    </div>
</template>

<style scoped>
/* 软薄荷应用色 —— light 模式专属;dark 模式落回全局 dark 主题 */
.notebook-shell {
    color: var(--color-ink);
    background: var(--color-bg);
}
:root.light .notebook-shell {
    --color-bg:        #fbfaf6;
    --color-bg-elev:   #ffffff;
    --color-bg-hi:     #f3f3f0;
    --color-card:      #ffffff;
    --color-card-hi:   #fbfbfa;
    --color-card-sub:  #f6f5ee;
    --color-line:      #ebebe6;
    --color-line-hi:   #d8d8d2;
    --color-ink:       #1c1c1a;
    --color-muted:     #6f6a5e;
    --color-faint:     #a8a294;
    --color-accent:    #4c9d8a;       /* 软薄荷绿 */
    --color-accent-hi: #3a8475;
    --color-accent-bg: #e2efea;
    --color-good:      #1a8a4a;
    --color-bad:       #b91c1c;
}
:root.dark .notebook-shell {
    --color-accent:    #6fc5b1;
    --color-accent-hi: #8ad5c3;
    --color-accent-bg: color-mix(in srgb, #6fc5b1 18%, transparent);
}
</style>
