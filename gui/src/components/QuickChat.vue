<script setup>
// 应用内浮层"问 AI" (右侧 side-sheet,移动端全屏铺满)。
// 顶部芯片显示当前 app 注入的 context.label,可一键关掉本次携带。
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import ChatCore from '@/apps/chat/chat.vue';
import { useQuickChatStore } from '@/stores/quickChat';

const qc = useQuickChatStore();

const visible = computed(() => qc.open);
const ctx = computed(() => qc.context);
const attached = computed(() => qc.includeContext);

function close() { qc.hide(); }

const prefaceForChat = computed(() => attached.value ? qc.effectiveSnapshot : '');

function onEscape(e) {
    if (e.key === 'Escape' && visible.value) close();
}

onMounted(() => document.addEventListener('keydown', onEscape));
onBeforeUnmount(() => document.removeEventListener('keydown', onEscape));

watch(visible, (v) => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = v ? 'hidden' : '';
});
</script>

<template>
    <Transition name="qc-fade">
        <div v-if="visible"
            class="fixed inset-0 z-[90] backdrop-blur-[2px]"
            style="background:color-mix(in srgb, var(--color-bg) 50%, transparent)"
            @click.self="close" />
    </Transition>
    <Transition name="qc-slide">
        <aside v-if="visible" role="dialog" :aria-label="'__T_QC_TITLE__'"
            class="shadow-card-lg fixed inset-y-0 right-0 z-[95] flex w-[420px] max-w-[100vw] min-h-0 flex-col border-l border-line bg-bg max-md:w-screen max-md:border-l-0">
            <header class="flex flex-none items-center justify-between gap-3 border-b border-line px-3.5 py-3">
                <div class="flex min-w-0 items-center gap-2">
                    <span class="msi" style="font-size:20px">smart_toy</span>
                    <span class="truncate text-[13px] font-medium text-ink">__T_QC_TITLE__</span>
                </div>
                <button @click="close" :aria-label="'__T_QC_CLOSE__'"
                    class="grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink">
                    <span class="msi" style="font-size:20px">close</span>
                </button>
            </header>

            <div v-if="ctx" class="flex flex-none items-center gap-2 border-b border-line bg-bg-elev px-3.5 py-2 text-[12px] text-muted">
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

            <div class="min-h-0 flex-1 flex flex-col">
                <ChatCore
                    context-scene="inline-help"
                    :context-snapshot="prefaceForChat"
                    :auto-open-last="false" />
            </div>
        </aside>
    </Transition>
</template>

<style scoped>
/* 仅留 Vue Transition 必需的过渡样式。 */
.qc-fade-enter-active, .qc-fade-leave-active { transition: opacity .18s ease; }
.qc-fade-enter-from, .qc-fade-leave-to { opacity: 0; }
.qc-slide-enter-active, .qc-slide-leave-active { transition: transform .22s cubic-bezier(.2,.7,.2,1); }
.qc-slide-enter-from, .qc-slide-leave-to { transform: translateX(100%); }
</style>
