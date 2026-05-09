<script setup>
import { fmtNum, langClr, renderMd } from './utils.js';

defineProps({
    items: { type: Array, default: () => [] }
});
</script>

<template>
    <div class="mx-auto max-w-[820px] px-4 py-4">
        <div v-if="!items.length" class="py-16 text-center text-sm text-[#484f58]">
            __T_GH_HISTORY_EMPTY__
        </div>
        <div v-else class="space-y-3">
            <div v-for="item in items" :key="item.id"
                 class="rounded-xl border border-[#21262d] bg-[#161b22] p-4">
                <div class="mb-3 flex items-start gap-3">
                    <img :src="item.repo_avatar" class="mt-0.5 h-7 w-7 shrink-0 rounded-full" />
                    <div class="min-w-0 flex-1">
                        <a :href="item.repo_url" target="_blank"
                           class="text-sm font-semibold text-[#58a6ff] hover:underline">
                            {{ item.repo_name }}
                        </a>
                        <div class="mt-0.5 flex items-center gap-3 text-[11px] text-[#484f58]">
                            <span v-if="item.repo_language" class="flex items-center gap-1">
                                <span class="h-2 w-2 rounded-full" :style="{ background: langClr(item.repo_language) }"></span>
                                {{ item.repo_language }}
                            </span>
                            <span>⭐ {{ fmtNum(item.repo_stars) }}</span>
                            <span class="text-[#30363d]">{{ item.created_at?.slice(0, 10) }}</span>
                        </div>
                    </div>
                </div>
                <div class="text-xs leading-relaxed text-[#8b949e]" v-html="renderMd(item.analysis)"></div>
            </div>
        </div>
    </div>
</template>
