<template>
  <div class="flex h-full min-h-0 flex-col" style="background:#fbf9f4;color:#2a1f13">
    <div class="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
      <div
        v-if="loading && !items.length"
        class="px-7 py-[72px] text-center text-[12px]"
        style="color:rgba(90,70,50,0.45)"
      >__T_TIMELINE_LOADING__</div>

      <div
        v-else-if="!items.length"
        class="flex flex-col items-center gap-[6px] px-7 py-[72px] text-center"
      >
        <div class="text-[13px] font-semibold" style="color:rgba(42,31,19,0.85)">__T_TIMELINE_EMPTY_TITLE__</div>
        <div class="max-w-[420px] text-[11.5px] leading-[1.7]" style="color:rgba(90,70,50,0.48)">__T_TIMELINE_EMPTY_DESC__</div>
      </div>

      <template v-else>
        <div v-for="group in groupedItems" :key="group.key">
          <div class="flex items-center gap-[10px] px-[24px] pb-[6px] pt-[18px]">
            <span
              class="shrink-0 whitespace-nowrap text-[9.5px] font-bold uppercase tracking-[0.16em]"
              style="color:rgba(90,70,50,0.42)"
            >{{ group.label }}</span>
            <span class="h-px flex-1" style="background:rgba(90,70,50,0.08)"></span>
          </div>

          <div
            v-for="item in group.items"
            :key="item.id"
            class="relative border-b px-[24px] pb-[11px] pt-[10px] transition-colors before:absolute before:bottom-0 before:left-0 before:top-0 before:w-[2px] before:bg-transparent before:transition-colors before:content-[''] last:border-b-0 hover:bg-[rgba(140,100,60,0.035)] hover:before:bg-[rgba(140,100,60,0.32)]"
            style="border-color:rgba(90,70,50,0.05)"
          >
            <div class="mb-[3px] flex items-baseline gap-[10px]">
              <span
                class="shrink-0 rounded-[3px] px-[6px] py-[1.5px] font-mono text-[9.5px] font-bold uppercase leading-[1.55] tracking-[0.08em]"
                style="background:rgba(140,100,60,0.09);color:rgba(120,80,40,0.72)"
              >{{ item.source_app }}</span>
              <span
                v-if="displayTitle(item)"
                class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] font-semibold"
                style="color:rgba(42,31,19,0.68)"
              >{{ displayTitle(item) }}</span>
              <span
                class="ml-auto shrink-0 font-mono text-[10.5px] tabular-nums"
                style="color:rgba(90,70,50,0.38)"
              >{{ formatTime(item.created_at) }}</span>
            </div>
            <div
              class="whitespace-pre-wrap break-words text-[12.5px] leading-[1.68]"
              style="color:rgba(42,31,19,0.82)"
            >{{ item.content }}</div>
          </div>
        </div>

        <div v-if="totalPages > 1" class="flex items-center justify-center gap-[14px] pb-[18px] pt-[22px]">
          <button
            class="rounded-[6px] border bg-white px-[14px] py-[4px] text-[11px] font-semibold transition-colors hover:bg-[rgba(90,70,50,0.04)] hover:text-[#2a1f13] disabled:cursor-not-allowed disabled:opacity-[0.32]"
            style="border-color:rgba(90,70,50,0.14);color:rgba(42,31,19,0.62)"
            :disabled="page <= 1 || loading"
            @click="loadItems(page - 1)"
          >__T_TIMELINE_PREV__</button>
          <span class="font-mono text-[11px] tabular-nums" style="color:rgba(90,70,50,0.48)">{{ page }} / {{ totalPages }}</span>
          <button
            class="rounded-[6px] border bg-white px-[14px] py-[4px] text-[11px] font-semibold transition-colors hover:bg-[rgba(90,70,50,0.04)] hover:text-[#2a1f13] disabled:cursor-not-allowed disabled:opacity-[0.32]"
            style="border-color:rgba(90,70,50,0.14);color:rgba(42,31,19,0.62)"
            :disabled="page >= totalPages || loading"
            @click="loadItems(page + 1)"
          >__T_TIMELINE_NEXT__</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { LOCALE_FULL } from '../../system/locale.js';

const loading = ref(false);
const items = ref([]);
const page = ref(1);
const total = ref(0);
const totalPages = ref(1);

const request = async (url) => {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || `${res.status}`);
  return data;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatTime = (value) => {
  const date = parseDate(value);
  if (!date) return '';
  return date.toLocaleTimeString(LOCALE_FULL, { hour: '2-digit', minute: '2-digit' });
};

const dayKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const dayLabel = (date) => {
  const now = new Date();
  const todayKey = dayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const beforeYesterday = new Date(now);
  beforeYesterday.setDate(now.getDate() - 2);

  if (dayKey(date) === todayKey) return '今天';
  if (dayKey(date) === dayKey(yesterday)) return '昨天';
  if (dayKey(date) === dayKey(beforeYesterday)) return '前天';

  const msPerDay = 86400000;
  const diff = Math.floor((now.setHours(0,0,0,0) - new Date(date).setHours(0,0,0,0)) / msPerDay);
  if (diff > 0 && diff < 14) return `${diff} 天前`;

  return date.toLocaleDateString(LOCALE_FULL, { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const groupedItems = computed(() => {
  const groups = new Map();
  for (const item of items.value) {
    const date = parseDate(item.created_at);
    if (!date) continue;
    const key = dayKey(date);
    if (!groups.has(key)) {
      groups.set(key, { key, label: dayLabel(date), items: [] });
    }
    groups.get(key).items.push(item);
  }
  return Array.from(groups.values());
});

const displayTitle = (item) => {
  if (item.source_app === 'chat') return item.conversation_title || '__T_TIMELINE_UNTITLED__';
  return item.title || '';
};

const loadItems = async (nextPage = 1) => {
  loading.value = true;
  try {
    const data = await request(`/api/timeline/list?page=${nextPage}&pageSize=20`);
    items.value = Array.isArray(data.items) ? data.items : [];
    page.value = Number(data.page || nextPage);
    total.value = Number(data.total || 0);
    totalPages.value = Number(data.totalPages || 1);
  } finally {
    loading.value = false;
  }
};

onMounted(() => loadItems(1));
</script>
