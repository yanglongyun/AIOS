<template>
  <div class="speaker-grille" ref="grilleEl">
    <div class="grille-shadow"></div>

    <div v-if="!today && !items.length" class="flex flex-1 items-center justify-center py-20">
      <p class="text-center text-[13px] text-[#604830]">__T_SUBSCRIBER_FILL_FOCUS_HINT__</p>
    </div>

    <div v-if="today" class="relative mb-8 border-b-2 border-dashed border-[rgba(232,192,96,0.12)] pb-8" :class="{ 'cursor-pointer': selectedId && selectedId !== today.id }" @click="$emit('select-article', today)">
      <div class="mb-[15px] font-['Courier_New',monospace] text-xs font-black uppercase tracking-[2px] text-[#a08040]">
        <span class="text-[#e84030]">>>> {{ today.date }} //</span> {{ formatTime(today.updatedAt || today.createdAt) }}
      </div>
      <h2 class="mb-[14px] font-['Georgia',serif] text-2xl font-black leading-[1.3] tracking-[-0.3px] text-[#ece4cd]">{{ today.title }}</h2>
      <div v-if="today.brief" class="mb-[22px] border border-[rgba(232,192,96,0.12)] bg-[rgba(232,192,96,0.06)] px-[18px] py-[14px] text-sm font-bold leading-[1.65] text-[#c8b890] shadow-[3px_3px_0_rgba(0,0,0,0.1)]">
        <span class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#e84030]">AI SYNOPSIS</span>
        {{ today.brief }}
      </div>
      <div v-if="selectedId === today.id || !selectedId" class="article-content whitespace-pre-wrap text-[15px] leading-[1.8] text-[#9a8a68]" style="text-align:justify;">{{ today.content }}</div>
    </div>

    <div
      v-for="item in visibleHistory"
      :key="item.id"
      class="relative mb-8 cursor-pointer border-b-2 border-dashed border-[rgba(232,192,96,0.12)] pb-8 opacity-45 transition-opacity hover:opacity-100"
      :class="{ '!opacity-100': selectedId === item.id }"
      @click="$emit('select-article', item)"
    >
      <div class="mb-[15px] font-['Courier_New',monospace] text-xs font-black uppercase tracking-[2px] text-[#a08040]">>>> {{ item.date }} // {{ formatTime(item.updatedAt || item.createdAt) }}</div>
      <h2 class="mb-[14px] font-['Georgia',serif] text-2xl font-black leading-[1.3] tracking-[-0.3px] text-[#ece4cd]">{{ item.title }}</h2>
      <div v-if="item.brief" class="mb-[22px] border border-[rgba(232,192,96,0.12)] bg-[rgba(232,192,96,0.06)] px-[18px] py-[14px] text-sm font-bold leading-[1.65] text-[#c8b890] shadow-[3px_3px_0_rgba(0,0,0,0.1)]">
        <span class="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#806040]">AI SYNOPSIS</span>
        {{ item.brief }}
      </div>
      <div v-if="selectedId === item.id" class="article-content whitespace-pre-wrap text-[15px] leading-[1.8] text-[#9a8a68]" style="text-align:justify;">{{ item.content }}</div>
    </div>

    <div v-if="totalPages > 1" class="mt-4 flex items-center justify-center gap-6 pb-4">
      <button class="text-[12px] font-bold text-[#806040] disabled:opacity-30" :disabled="page <= 1" @click="$emit('change-page', page - 1)">__T_SUBSCRIBER_PREV_PAGE__</button>
      <span class="text-[10px] text-[#604830]">{{ page }} / {{ totalPages }}</span>
      <button class="text-[12px] font-bold text-[#806040] disabled:opacity-30" :disabled="page >= totalPages" @click="$emit('change-page', page + 1)">__T_SUBSCRIBER_NEXT_PAGE__</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  today: { type: Object, default: null },
  items: { type: Array, required: true },
  visibleHistory: { type: Array, required: true },
  selectedId: { type: [String, Number, null], default: null },
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  formatTime: { type: Function, required: true }
});

defineEmits(['select-article', 'change-page']);

</script>
