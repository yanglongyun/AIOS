<script setup>
// 系统级 launcher: 9 宫格应用面板 + 问 AI 按钮 + 主题切换。
// 由各 app 自行 import 并放置(在 header 内 / 浮在角上 / 自定义皆可)。
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MessageCircle, LayoutGrid, Moon, Sun } from 'lucide-vue-next';
import { apps } from '../apps.js';
import { useQuickChatStore } from '@/stores/quickChat';
import { useThemeStore } from '@/stores/theme';

const router = useRouter();
const route = useRoute();
const qc = useQuickChatStore();
const theme = useThemeStore();
const isLight = computed(() => theme.resolved === 'light');

const root = ref(null);
const appsOpen = ref(false);

function toggleApps() { appsOpen.value = !appsOpen.value; }
function closeAll() { appsOpen.value = false; }

function goApp(id) {
    closeAll();
    const path = `/app/${id}`;
    if (route.path !== path) router.push(path);
}

function onChat() {
    closeAll();
    qc.toggle();
}

function onDocClick(e) {
    if (!root.value) return;
    if (!root.value.contains(e.target)) closeAll();
}
function onEscape(e) {
    if (e.key === 'Escape') closeAll();
}

onMounted(() => {
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEscape);
});
onBeforeUnmount(() => {
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onEscape);
});
</script>

<template>
    <div ref="root" class="inline-flex">
        <div class="relative inline-flex items-center gap-1">
            <!-- chat app 内不显示"问 AI"按钮 —— 套娃没意义 -->
            <button v-if="route.params.id !== 'chat'"
                data-qc-trigger
                class="grid h-10 w-10 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                :class="{ '!bg-blue-bg !text-blue-fg': qc.open }"
                @click="onChat" :title="'__T_QC_TITLE__'" :aria-label="'__T_QC_TITLE__'">
                <MessageCircle :size="20" :stroke-width="1.8" />
            </button>
            <button
                class="grid h-10 w-10 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                :class="{ '!bg-blue-bg !text-blue-fg': appsOpen }"
                @click="toggleApps" :title="'__T_NAV_APPS__'" :aria-label="'__T_NAV_APPS__'">
                <LayoutGrid :size="22" :stroke-width="1.8" />
            </button>

            <div v-if="appsOpen" role="menu"
                class="shadow-card-lg fixed z-[80] overflow-hidden rounded-2xl border border-line bg-bg-elev
                       top-[58px] right-3 w-[384px] max-h-[calc(100vh-72px)]
                       max-md:left-3 max-md:w-auto max-md:max-h-[calc(100vh-72px)]
                       flex flex-col">
                <div class="flex-1 min-h-0 overflow-y-auto p-4">
                    <div class="grid grid-cols-3 gap-2">
                        <button v-for="app in apps" :key="app.id"
                            class="group flex min-h-[104px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-0 bg-transparent px-2 py-4 text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                            :class="{ '!bg-blue-bg !text-blue-fg': route.params.id === app.id }"
                            @click="goApp(app.id)">
                            <span class="grid h-12 w-12 place-items-center rounded-2xl bg-bg transition-colors group-hover:bg-bg-elev"
                                :class="{ '!bg-bg-elev': route.params.id === app.id }">
                                <component :is="app.icon" :size="26" :stroke-width="1.6" />
                            </span>
                            <span class="line-clamp-2 break-all text-center text-[12px] font-medium leading-tight">{{ app.name }}</span>
                        </button>
                    </div>
                </div>
                <div class="border-t border-line p-2">
                    <button
                        class="flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-[13px] text-ink transition-colors hover:bg-bg-hi"
                        @click="theme.toggle"
                        :title="isLight ? '__T_THEME_TO_DARK__' : '__T_THEME_TO_LIGHT__'">
                        <component :is="isLight ? Moon : Sun" :size="18" :stroke-width="1.8" class="text-muted" />
                        <span>{{ isLight ? '__T_THEME_TO_DARK__' : '__T_THEME_TO_LIGHT__' }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
