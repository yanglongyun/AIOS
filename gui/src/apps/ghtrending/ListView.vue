<script setup>
import { TIME_FILTERS, fmtNum, langClr, renderMd } from './utils.js';

defineProps({
    repos: { type: Array, default: () => [] },
    analyses: { type: Object, default: () => ({}) },
    analyzingId: { type: [String, Number, null], default: null },
    since: { type: String, default: 'weekly' },
    loading: { type: Boolean, default: false },
    digestText: { type: String, default: '' },
    digesting: { type: Boolean, default: false }
});

defineEmits(['pick-time', 'analyze', 'digest', 'clear-digest']);
</script>

<template>
    <div class="mx-auto max-w-[820px] px-4 py-4">

        <!-- 时间筛选 -->
        <div class="mb-3 flex w-fit shrink-0 rounded-lg border border-[#30363d] bg-[#161b22] p-0.5 shadow-sm">
            <button v-for="t in TIME_FILTERS" :key="t.id"
                    class="rounded-md px-4 py-1.5 text-[12px] font-medium transition-all"
                    :class="since === t.id
                        ? 'bg-[#21262d] text-[#c9d1d9] shadow-sm ring-1 ring-white/10'
                        : 'text-[#8b949e] hover:text-[#c9d1d9]'"
                    @click="$emit('pick-time', t.id)">
                {{ t.label }}
            </button>
        </div>

        <div v-if="loading" class="py-16 text-center text-sm text-[#484f58]">加载中…</div>

        <template v-else>
            <!-- Digest -->
            <div class="mb-3">
                <div v-if="!digestText"
                     class="flex items-center justify-between gap-3 rounded-xl border border-[#388bfd]/20 bg-[#388bfd]/10 p-4">
                    <div class="min-w-0">
                        <div class="mb-1 text-[13px] font-bold text-[#58a6ff]">本周热榜总览</div>
                        <div class="text-[11px] text-[#58a6ff]/70">AI 阅读全部仓库后给出主题与代表项目的中文总结</div>
                    </div>
                    <button :disabled="digesting"
                            class="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#238636] px-4 py-2 text-[12px] font-medium text-white transition-all hover:bg-[#2ea043] active:scale-95 disabled:opacity-40"
                            @click="$emit('digest')">
                        <svg v-if="digesting" class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                            <path class="opacity-75" fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span v-else>✦</span>
                        {{ digesting ? '总览生成中…' : '总览' }}
                    </button>
                </div>
                <div v-else class="rounded-xl border border-[#21262d] bg-[#161b22] p-5 text-xs leading-relaxed text-[#8b949e]">
                    <div class="mb-4 flex items-center justify-between border-b border-[#21262d] pb-3">
                        <span class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#58a6ff]">
                            <span class="text-[14px]">✦</span> 总览
                        </span>
                        <button class="text-[12px] text-[#484f58] transition-colors hover:text-[#c9d1d9]"
                                @click="$emit('clear-digest')">✕</button>
                    </div>
                    <div class="prose prose-sm prose-invert max-w-none text-[#8b949e]" v-html="renderMd(digestText)"></div>
                </div>
            </div>

            <!-- Repo cards -->
            <div class="space-y-3">
                <div v-for="repo in repos" :key="repo.id"
                     class="rounded-xl border border-[#21262d] bg-[#161b22] p-4 transition-colors hover:border-[#30363d]">
                    <div class="flex items-start gap-3">
                        <img :src="repo.avatar" class="mt-0.5 h-8 w-8 shrink-0 rounded-full" />
                        <div class="min-w-0 flex-1">
                            <a :href="repo.url" target="_blank"
                               class="mb-1 block truncate text-sm font-semibold text-[#58a6ff] hover:underline">
                                {{ repo.name }}
                            </a>
                            <p v-if="repo.description" class="mb-3 text-xs leading-relaxed text-[#8b949e]">
                                {{ repo.description }}
                            </p>
                            <div class="flex items-center gap-4 text-[11px] text-[#484f58]">
                                <span v-if="repo.language" class="flex items-center gap-1">
                                    <span class="h-2.5 w-2.5 rounded-full" :style="{ background: langClr(repo.language) }"></span>
                                    {{ repo.language }}
                                </span>
                                <span>⭐ {{ fmtNum(repo.stars) }}</span>
                                <span>🍴 {{ fmtNum(repo.forks) }}</span>
                            </div>
                        </div>
                        <button :disabled="analyzingId === repo.id || !!analyses[repo.id]"
                                class="shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all disabled:opacity-40"
                                :class="analyses[repo.id]
                                    ? 'bg-[#238636]/15 text-[#3fb950]'
                                    : 'bg-[#21262d] text-[#8b949e] hover:bg-[#388bfd]/10 hover:text-[#58a6ff]'"
                                @click="$emit('analyze', repo)">
                            {{ analyses[repo.id] ? '✦ 已分析' : '✦ 深读' }}
                        </button>
                    </div>
                    <div v-if="analyzingId === repo.id && !analyses[repo.id]"
                         class="mt-4 flex items-center gap-2 border-t border-[#21262d] pt-4 text-xs text-[#8b949e]">
                        <svg class="h-4 w-4 animate-spin text-[#58a6ff]" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                            <path class="opacity-75" fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span class="animate-pulse">AI 正在阅读 README 与关键文件…</span>
                    </div>
                    <div v-else-if="analyses[repo.id]"
                         class="mt-3 border-t border-[#21262d] pt-3 text-xs leading-relaxed text-[#8b949e]"
                         v-html="renderMd(analyses[repo.id])"></div>
                </div>
            </div>
        </template>
    </div>
</template>
