<template>
  <div class="flex h-full flex-col bg-white text-[#21293c]" style="font-family: -apple-system, 'PingFang SC', sans-serif;">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-3 border-b border-[#f0f0f0] shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 bg-[#da552f] rounded-lg flex items-center justify-center text-white text-xs font-bold">P</div>
        <span class="font-bold text-sm">__T_PH_TITLE__</span>
        <span class="text-[11px] text-[#999] font-normal">Today's Top Launches</span>
      </div>
      <button @click="doReview" :disabled="reviewing"
        class="px-3.5 py-1.5 text-[11px] font-medium rounded-lg transition-all disabled:opacity-30"
        :class="reviewing ? 'bg-[#f5f5f5] text-[#999]' : 'bg-[#da552f]/8 text-[#da552f] hover:bg-[#da552f]/15'">
        {{ reviewing ? '__T_PH_REVIEWING__' : '✦ __T_PH_REVIEW__' }}
      </button>
    </div>

    <!-- AI Review -->
    <div v-if="reviewText" class="mx-4 mt-3 bg-[#fef9f6] border border-[#fde8de] rounded-xl p-4 text-sm leading-relaxed text-[#8c6d5f]">
      <div v-html="renderMd(reviewText)"></div>
      <button @click="reviewText = ''" class="mt-2 text-[10px] text-[#d4b5a5] hover:text-[#8c6d5f]">__T_PH_DISMISS__</button>
    </div>

    <!-- Products -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="text-center text-[#ccc] text-sm py-16">__T_PH_LOADING__</div>
      <div v-else-if="!products.length" class="text-center text-[#ccc] text-sm py-16">__T_PH_EMPTY__</div>
      <div v-else class="p-4 space-y-2.5">
        <div v-for="(p, i) in products" :key="p.slug"
          class="flex items-center gap-4 p-4 bg-white border border-[#f0f0f0] rounded-xl hover:border-[#e0e0e0] hover:shadow-sm transition-all">
          <!-- Rank badge -->
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
            :class="i < 3 ? 'bg-[#da552f]/10 text-[#da552f]' : 'bg-[#f5f5f5] text-[#999]'">
            {{ i + 1 }}
          </div>
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <a :href="p.url" target="_blank" class="text-sm font-semibold text-[#21293c] hover:text-[#da552f] transition-colors">{{ p.name }}</a>
            <p class="text-[#999] text-xs mt-0.5 line-clamp-1">{{ p.tagline }}</p>
          </div>
          <!-- Upvote button -->
          <div class="flex flex-col items-center gap-0.5 shrink-0 px-3 py-2 border rounded-xl transition-colors"
            :class="i < 3 ? 'border-[#da552f]/20 bg-[#da552f]/3' : 'border-[#eee]'">
            <span class="text-[#da552f] text-[10px]">▲</span>
            <span class="text-xs font-bold" :class="i < 3 ? 'text-[#da552f]' : 'text-[#666]'">{{ p.votes }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { marked } from 'marked';
import { LOCALE } from '../../locale.js';
marked.setOptions({ breaks: true, gfm: true });
const renderMd = (t) => marked.parse(t || '');

const products = ref([]); const loading = ref(false); const reviewing = ref(false); const reviewText = ref('');

const loadProducts = async () => { loading.value = true; try { products.value = (await (await fetch('/aios/apps/producthunt/list')).json()).products || []; } catch {} loading.value = false; };

const doReview = async () => {
  reviewing.value = true;
  try { reviewText.value = (await (await fetch('/aios/apps/producthunt/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products: products.value, locale: LOCALE }) })).json()).review || ''; }
  catch { reviewText.value = 'Failed'; } reviewing.value = false;
};

onMounted(() => loadProducts());
</script>
