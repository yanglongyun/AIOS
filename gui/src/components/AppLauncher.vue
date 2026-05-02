<script setup>
// 系统级 launcher: 9 宫格应用面板 + 问 AI 按钮 + 主题切换。
// 由各 app 自行 import 并放置(在 header 内 / 浮在角上 / 自定义皆可)。
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
                <span class="msi" style="font-size:20px">chat_bubble</span>
            </button>
            <button
                class="grid h-10 w-10 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                :class="{ '!bg-blue-bg !text-blue-fg': appsOpen }"
                @click="toggleApps" :title="'__T_NAV_APPS__'" :aria-label="'__T_NAV_APPS__'">
                <span class="msi" style="font-size:22px">apps</span>
            </button>

            <div v-if="appsOpen" role="menu"
                class="shadow-card-lg absolute right-0 top-[calc(100%+8px)] z-[80] w-80 rounded-2xl border border-line bg-bg-elev p-3 max-md:w-[min(86vw,320px)]">
                <div class="grid grid-cols-3 gap-1">
                    <button v-for="app in apps" :key="app.id"
                        class="flex min-h-[84px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-0 bg-transparent px-2 py-3.5 text-muted transition-colors hover:bg-bg-hi hover:text-ink"
                        :class="{ '!bg-blue-bg !text-blue-fg': route.params.id === app.id }"
                        @click="goApp(app.id)">
                        <span class="grid h-9 w-9 place-items-center">
                            <span class="msi" style="font-size:26px"
                                :class="{ filled: route.params.id === app.id }">{{ app.icon }}</span>
                        </span>
                        <span class="line-clamp-2 break-all text-center text-[11px] font-medium leading-tight">{{ app.name }}</span>
                    </button>
                </div>
                <div class="-mx-1 mb-1.5 mt-2 h-px bg-line"></div>
                <button
                    class="flex w-full cursor-pointer items-center gap-3 rounded-[10px] border-0 bg-transparent px-3 py-2.5 text-left text-[13px] text-ink transition-colors hover:bg-bg-hi"
                    @click="theme.toggle"
                    :title="isLight ? '__T_THEME_TO_DARK__' : '__T_THEME_TO_LIGHT__'">
                    <span class="msi text-muted" style="font-size:20px">{{ isLight ? 'dark_mode' : 'light_mode' }}</span>
                    <span>{{ isLight ? '__T_THEME_TO_DARK__' : '__T_THEME_TO_LIGHT__' }}</span>
                </button>
            </div>
        </div>
    </div>
</template>
