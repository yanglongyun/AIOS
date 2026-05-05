<script setup>
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { Hammer, Hourglass, Search, Sparkles, Wand2 } from 'lucide-vue-next';
import { useQuickChatStore } from '@/stores/quickChat';

const router = useRouter();
const qc = useQuickChatStore();

const ideas = ref([]);
const loading = ref(false);
const error = ref('');
const query = ref('');
const selected = ref(null);

const loadIdeas = async () => {
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch('/apps/workshop/ideas');
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);
    ideas.value = Array.isArray(data.items) ? data.items : [];
    selected.value = selected.value
      ? ideas.value.find((item) => item.id === selected.value.id) || ideas.value[0] || null
      : ideas.value[0] || null;
  } catch (e) {
    error.value = e.message || '__T_WORKSHOP_LOAD_FAILED__';
  } finally {
    loading.value = false;
  }
};

const categories = computed(() => {
  const map = new Map();
  for (const idea of ideas.value) {
    const key = idea.category || 'general';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ key, count }));
});

const filteredIdeas = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return ideas.value;
  return ideas.value.filter((item) => [item.title, item.category, item.summary, item.prompt]
    .some((value) => String(value || '').toLowerCase().includes(q)));
});

const buildMessage = (idea) => [
  `我想基于「${idea.title}」生成一个 demo。`,
  '',
  idea.prompt,
  '',
  '请先给出产品结构和界面方案，然后直接生成一个可以运行的前端 demo。'
].join('\n');

const generateDemo = (idea = selected.value) => {
  if (!idea) return;
  router.push({
    path: '/app/chat',
    query: {
      workshopPrompt: buildMessage(idea),
      workshopIdea: idea.id,
      t: String(Date.now())
    }
  });
};

onMounted(loadIdeas);

watchEffect(() => {
  qc.setContext({
    scope: `workshop:${selected.value?.id || 'list'}`,
    label: selected.value
      ? '__T_QC_LABEL_WORKSHOP_IDEA__'.replace('{name}', selected.value.title || selected.value.id)
      : '__T_QC_LABEL_WORKSHOP_ROOT__',
    snapshot: [
      '__T_QC_FIELD_WORKSHOP_TOTAL__'.replace('{count}', ideas.value.length),
      selected.value ? '__T_QC_FIELD_SELECTED__'.replace('{name}', selected.value.title || selected.value.id) : null,
      selected.value?.summary ? '__T_QC_FIELD_INTRO__'.replace('{value}', selected.value.summary) : null
    ].filter(Boolean).join('\n')
  });
});
</script>

<template>
  <div class="flex h-full flex-col bg-bg text-ink">
    <header class="app-content flex flex-none items-center gap-3 px-8 pb-3 pt-7 max-md:px-4 max-md:pb-2 max-md:pt-5">
      <h1 class="m-0 text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] max-md:text-[19px]">__T_WORKSHOP_TITLE__</h1>
      <span class="font-mono text-[12.5px] text-faint">{{ ideas.length }}</span>
      <button
        class="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-blue-bg px-3.5 py-1.5 text-[13px] font-semibold text-blue-fg transition-colors hover:bg-blue-soft disabled:cursor-default disabled:opacity-50"
        :disabled="!selected"
        @click="generateDemo()">
        <Wand2 :size="16" :stroke-width="1.8" />
        <span>__T_WORKSHOP_GENERATE__</span>
      </button>
    </header>

    <div class="app-content grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_340px] gap-4 px-8 pb-10 max-lg:grid-cols-1 max-md:px-3">
      <main class="min-h-0 overflow-auto">
        <section class="mb-3 flex flex-wrap items-center gap-2">
          <label class="relative min-w-[220px] flex-1">
            <Search :size="16" :stroke-width="1.8" class="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              v-model="query"
              class="h-10 w-full rounded-lg border border-line-hi bg-bg-elev pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-faint focus:border-accent"
              placeholder="__T_WORKSHOP_SEARCH_PLACEHOLDER__" />
          </label>
          <div class="flex flex-wrap gap-1">
            <span v-for="cat in categories" :key="cat.key"
              class="inline-flex items-center gap-1.5 rounded-full border border-line-hi bg-bg px-3 py-1.5 text-[12px] text-muted">
              <span>{{ cat.key }}</span>
              <span class="text-[11px] text-faint">{{ cat.count }}</span>
            </span>
          </div>
        </section>

        <div v-if="error" class="mb-3 rounded-lg px-3.5 py-2 text-[13px] text-bad"
          style="background:color-mix(in srgb, var(--color-bad) 12%, transparent)">
          {{ error }}
        </div>

        <div v-if="loading && !ideas.length" class="flex flex-col items-center gap-2 py-16 text-muted">
          <Hourglass :size="30" :stroke-width="1.6" class="text-faint" />
          <div class="text-[14px]">__T_COMMON_LOADING__</div>
        </div>

        <div v-else-if="!filteredIdeas.length" class="rounded-lg border border-line bg-bg-elev py-12 text-center text-[13px] text-faint">
          __T_WORKSHOP_EMPTY__
        </div>

        <ul v-else class="m-0 grid list-none grid-cols-2 gap-2 p-0 max-xl:grid-cols-1">
          <li v-for="idea in filteredIdeas" :key="idea.id">
            <button
              class="flex h-full w-full cursor-pointer items-start gap-3 rounded-lg border border-line bg-bg-elev px-4 py-3 text-left transition-colors hover:bg-card-hi"
              :class="selected?.id === idea.id ? 'border-accent' : ''"
              @click="selected = idea">
              <span class="mt-0.5 grid h-10 w-10 flex-none place-items-center rounded-lg bg-bg-hi text-accent">
                <Sparkles :size="21" :stroke-width="1.7" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="flex items-baseline gap-2">
                  <span class="truncate text-[14px] font-semibold text-ink">{{ idea.title }}</span>
                  <span class="shrink-0 rounded border border-line px-1.5 py-px text-[10.5px] text-faint">{{ idea.category }}</span>
                </span>
                <span class="mt-1 line-clamp-2 block text-[12px] leading-[1.5] text-muted">{{ idea.summary }}</span>
                <span class="mt-2 inline-flex items-center gap-1 text-[11px] text-faint">
                  <Hammer :size="13" :stroke-width="1.8" />
                  <span>{{ idea.id }}</span>
                </span>
              </span>
            </button>
          </li>
        </ul>
      </main>

      <aside class="min-h-0 overflow-auto rounded-lg border border-line bg-bg-elev px-4 py-4"
        :class="{ 'max-lg:hidden': !selected }">
        <div v-if="!selected" class="flex h-full min-h-[260px] flex-col items-center justify-center gap-2 text-center text-muted">
          <Sparkles :size="32" :stroke-width="1.6" class="text-faint" />
          <div class="text-[13px]">__T_WORKSHOP_SELECT_HINT__</div>
        </div>
        <div v-else>
          <div class="flex items-start gap-3">
            <span class="grid h-11 w-11 flex-none place-items-center rounded-lg bg-bg-hi text-accent">
              <Sparkles :size="24" :stroke-width="1.6" />
            </span>
            <div class="min-w-0 flex-1">
              <h2 class="m-0 truncate text-[18px] font-semibold text-ink">{{ selected.title }}</h2>
              <div class="mt-1 font-mono text-[11px] text-faint">{{ selected.id }}</div>
            </div>
          </div>

          <p class="mt-4 whitespace-pre-wrap text-[13px] leading-[1.65] text-muted">{{ selected.summary }}</p>

          <div class="mt-4 rounded-lg border border-line bg-bg px-3 py-3">
            <div class="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">__T_WORKSHOP_PROMPT_LABEL__</div>
            <div class="whitespace-pre-wrap text-[12.5px] leading-[1.6] text-ink">{{ selected.prompt }}</div>
          </div>

          <button
            class="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border-0 bg-blue-bg px-3 py-2 text-[12.5px] font-semibold text-blue-fg transition-colors hover:bg-blue-soft"
            @click="generateDemo(selected)">
            <Wand2 :size="16" :stroke-width="1.8" />
            <span>__T_WORKSHOP_SEND_TO_CHAT__</span>
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
