<template>
  <div class="flex h-full flex-col bg-white text-[#21293c]" style="font-family: -apple-system, 'PingFang SC', sans-serif;">
    <div class="flex items-center gap-3 px-4 py-3 border-b border-[#eee] shrink-0">
      <span class="text-lg">🚀</span>
      <span class="font-semibold text-sm">__T_PH_TITLE__</span>
      <div class="ml-auto">
        <button @click="doReview" :disabled="reviewing"
          class="px-3 py-1.5 text-xs rounded-full border border-[#ddd] text-[#999] hover:border-[#da552f] hover:text-[#da552f] disabled:opacity-40 transition-colors">
          {{ reviewing ? '__T_PH_REVIEWING__' : '✦ __T_PH_REVIEW__' }}
        </button>
      </div>
    </div>
    <div v-if="reviewText" class="mx-4 mt-3 bg-[#fff8f5] border border-[#fde0d5] rounded-lg p-3 text-sm leading-relaxed text-[#666] whitespace-pre-wrap">
      {{ reviewText }}
      <button @click="reviewText = ''" class="block mt-2 text-[11px] text-[#ccc] hover:text-[#999]">__T_PH_DISMISS__</button>
    </div>
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="text-center text-[#999] text-sm py-12">__T_PH_LOADING__</div>
      <div v-else-if="!products.length" class="text-center text-[#999] text-sm py-12">__T_PH_EMPTY__</div>
      <div v-for="(p, i) in products" :key="p.slug"
        class="flex items-center gap-4 px-4 py-3 border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors">
        <div class="flex items-center justify-center w-10 h-10 bg-[#f5f5f5] rounded-lg text-lg shrink-0">{{ i + 1 }}</div>
        <div class="flex-1 min-w-0">
          <a :href="p.url" target="_blank" class="text-sm font-medium text-[#da552f] hover:underline">{{ p.name }}</a>
          <p class="text-[#999] text-xs mt-0.5">{{ p.tagline }}</p>
        </div>
        <div class="flex items-center gap-1 shrink-0 border border-[#eee] rounded-lg px-2.5 py-1.5">
          <span class="text-[#da552f] text-xs">▲</span>
          <span class="text-xs font-medium">{{ p.votes }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { chatPanel } from '../../stores/chatPanel.js';
import { LOCALE } from '../../locale.js';
const products = ref([]); const loading = ref(false); const reviewing = ref(false); const reviewText = ref('');
const loadProducts = async () => { loading.value = true; try { const res = await fetch('/aios/apps/producthunt/list'); const data = await res.json(); products.value = data.products || []; } catch {} loading.value = false; };
const doReview = async () => { reviewing.value = true; try { const res = await fetch('/aios/apps/producthunt/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products: products.value, locale: LOCALE }) }); const data = await res.json(); reviewText.value = data.review || ''; } catch { reviewText.value = 'Failed'; } reviewing.value = false; };
onMounted(() => { loadProducts(); chatPanel.setContext({ scene: 'producthunt', label: '__T_APP_SIDEBAR_PRODUCTHUNT__' }); chatPanel.setQuickMessages(['__T_PH_CHAT_QUICK_1__', '__T_PH_CHAT_QUICK_2__', '__T_PH_CHAT_QUICK_3__']); });
</script>
