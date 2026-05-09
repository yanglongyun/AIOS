<script setup>
import { fmtMasthead } from './utils.js';

defineProps({
    now: { type: Date, required: true }
});
</script>

<template>
    <header class="masthead-card relative mx-auto mb-[18px] flex max-w-[880px] items-center gap-6 overflow-hidden rounded-2xl px-8 py-7 text-blue-fg max-md:gap-3.5 max-md:rounded-xl max-md:px-5 max-md:py-5">
        <div class="min-w-0 flex-1">
            <div class="font-mono text-[12px] uppercase tracking-[0.08em] opacity-75">
                {{ fmtMasthead(now) }}
            </div>
            <h1 class="m-0 mb-1 mt-1.5 text-[28px] font-medium leading-[1.1] tracking-[-0.02em] max-md:text-[22px]">
                每日早报
            </h1>
            <p class="m-0 text-[13px] leading-[1.55] opacity-[0.78]">
                用一句话告诉 AI 你想订阅什么,每天到点自动送来。
            </p>
        </div>
        <div class="flex-none opacity-70">
            <span class="msi text-accent" style="font-size:64px">newspaper</span>
        </div>
    </header>
</template>

<style scoped>
/* 多层渐变 + 右上角发光,任意值写出来太长,下沉这一处 */
.masthead-card {
    background: linear-gradient(135deg, #e8f0fe 0%, #d4e4ff 60%, #c2d6fb 100%);
}
.masthead-card::after {
    content: '';
    position: absolute;
    right: -60px; top: -60px;
    width: 240px; height: 240px;
    background: radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 70%);
    pointer-events: none;
}
@media (max-width: 720px) {
    .masthead-card::after {
        right: -40px; top: -40px;
        width: 160px; height: 160px;
    }
    .masthead-card .msi { font-size: 44px !important; }
}
</style>
