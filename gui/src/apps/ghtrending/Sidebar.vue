<script setup>
import { LANGS, langClr } from './utils.js';

defineProps({
    mode: { type: String, default: 'list' },
    language: { type: String, default: '' },
    historyCount: { type: Number, default: 0 }
});

defineEmits(['pick-history', 'pick-lang']);
</script>

<template>
    <nav class="flex flex-col gap-0.5 py-2">
        <button class="gh-nav-item mt-2"
                :class="{ 'gh-nav-active': mode === 'history' }"
                @click="$emit('pick-history')">
            <span class="msi sm">history</span>
            <span class="flex-1 truncate text-left">已分析</span>
            <span v-if="historyCount"
                  class="rounded-full bg-[#21262d] px-2 py-px text-[10.5px] tabular-nums text-[#8b949e]">
                {{ historyCount }}
            </span>
        </button>

        <div class="px-4 pb-1 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#6e7681]">语言</div>

        <button class="gh-nav-item"
                :class="{ 'gh-nav-active': mode === 'list' && language === '' }"
                @click="$emit('pick-lang', '')">
            <span class="msi sm">all_inclusive</span>
            <span class="flex-1 truncate text-left">全部语言</span>
        </button>

        <button v-for="l in LANGS" :key="l"
                class="gh-nav-item"
                :class="{ 'gh-nav-active': mode === 'list' && language === l }"
                @click="$emit('pick-lang', l)">
            <span class="h-3 w-3 flex-none rounded-full border border-white/10"
                  :style="{ background: langClr(l) }"></span>
            <span class="flex-1 truncate text-left">{{ l }}</span>
        </button>
    </nav>
</template>

<style scoped>
.gh-nav-item {
    display: flex; align-items: center; gap: 14px;
    width: 100%;
    padding: 0 16px;
    height: 38px;
    border: 0;
    background: transparent;
    border-radius: 0 20px 20px 0;
    color: #c9d1d9;
    font-size: 13px;
    cursor: pointer;
    transition: background .12s, color .12s;
}
.gh-nav-item .msi { color: #8b949e; flex: none; }
.gh-nav-item:hover { background: rgba(255,255,255,0.05); }
.gh-nav-active { background: rgba(88,166,255,0.16) !important; color: #58a6ff !important; }
.gh-nav-active .msi { color: #58a6ff; }
</style>
