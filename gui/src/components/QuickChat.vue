<script setup>
// 应用内浮层"问 AI" — 顶栏右下方挂出的面板，类似 AppLauncher 的下拉。
// 点击触发按钮（标了 [data-qc-trigger]）或面板内不会关闭；点其它地方或 Esc 关闭。
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import ChatCore from '@/apps/chat/chat.vue';
import { useQuickChatStore } from '@/stores/quickChat';

const qc = useQuickChatStore();

const visible = computed(() => qc.open);
const ctx = computed(() => qc.context);
const attached = computed(() => qc.includeContext);

const root = ref(null);

function close() { qc.hide(); }

const prefaceForChat = computed(() => attached.value ? qc.effectiveSnapshot : '');

function onEscape(e) {
    if (e.key === 'Escape' && visible.value) close();
}

function onDocClick(e) {
    if (!visible.value) return;
    if (!root.value) return;
    if (root.value.contains(e.target)) return;
    if (e.target.closest?.('[data-qc-trigger]')) return;
    close();
}

onMounted(() => {
    document.addEventListener('keydown', onEscape);
    document.addEventListener('click', onDocClick);
});
onBeforeUnmount(() => {
    document.removeEventListener('keydown', onEscape);
    document.removeEventListener('click', onDocClick);
});

watch(visible, (v) => {
    if (typeof document === 'undefined') return;
    // 不再锁页面滚动 —— 现在是非全屏浮层。
    if (!v) document.body.style.overflow = '';
});
</script>

<template>
    <Transition name="qc-fade">
        <aside v-if="visible" ref="root" role="dialog" :aria-label="'__T_QC_TITLE__'"
            class="qc-panel fixed top-[64px] right-4 z-[95] flex w-[440px] min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-bg-elev max-md:left-3 max-md:right-3 max-md:top-[58px] max-md:w-auto">
            <header class="flex flex-none items-center justify-between gap-3 border-b border-line px-3.5 py-3">
                <div class="flex min-w-0 items-center gap-2">
                    <span class="msi" style="font-size:20px">smart_toy</span>
                    <span class="truncate text-[13px] font-medium text-ink">__T_QC_TITLE__</span>
                </div>
                <button @click="close" :aria-label="'__T_QC_CLOSE__'"
                    class="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink">
                    <span class="msi" style="font-size:18px">close</span>
                </button>
            </header>

            <div v-if="ctx" class="flex flex-none items-center gap-2 border-b border-line bg-bg px-3.5 py-2 text-[12px] text-muted">
                <span class="msi text-faint" style="font-size:14px">link</span>
                <span class="flex-1 min-w-0 truncate"
                    :class="attached ? 'text-ink' : 'text-faint line-through'">{{ ctx.label || '__T_QC_CONTEXT_DEFAULT__' }}</span>
                <button v-if="attached" @click="qc.includeContext = false" :title="'__T_QC_CONTEXT_DROP__'"
                    class="grid h-[22px] w-[22px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink">
                    <span class="msi" style="font-size:14px">close</span>
                </button>
                <button v-else @click="qc.includeContext = true" :title="'__T_QC_CONTEXT_REATTACH__'"
                    class="grid h-[22px] w-[22px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-accent transition-colors hover:bg-bg-hi">
                    <span class="msi" style="font-size:14px">add_link</span>
                </button>
            </div>

            <div class="qc-body min-h-0 flex-1 flex flex-col">
                <ChatCore
                    context-scene="inline-help"
                    :context-snapshot="prefaceForChat"
                    :auto-open-last="false" />
            </div>
        </aside>
    </Transition>
</template>

<style scoped>
.qc-panel {
    height: min(640px, calc(100vh - 88px));
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.06);
}
@media (max-width: 768px) {
    .qc-panel {
        height: min(560px, calc(100vh - 80px));
    }
}

.qc-fade-enter-active, .qc-fade-leave-active {
    transition: opacity .18s ease, transform .18s cubic-bezier(.2,.7,.2,1);
}
.qc-fade-enter-from, .qc-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px) scale(0.985);
}
</style>
