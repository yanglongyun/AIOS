<script setup>
// 响应式 drawer:
//  · 桌面 (≥768px) 打开时占据左侧 240px,推 main 内容右移
//  · 手机 (<768px) 打开时 fixed 浮在内容上方 + 遮罩
//  · ☰ 触发 / Esc 关闭 / 手机点遮罩关闭
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useViewStore } from '@/stores/view';
import { useThemeStore } from '@/stores/theme';
import { Moon, Sun } from 'lucide-vue-next';
import { apps } from '../apps.js';

const view = useViewStore();
const theme = useThemeStore();
const router = useRouter();
const route = useRoute();

const topApps = computed(() => apps.filter((app) => app.group === 'top'));
const middleApps = computed(() => apps.filter((app) => app.group === 'apps'));
const bottomApps = computed(() => apps.filter((app) => app.group === 'bottom'));

const isMobile = () => window.innerWidth < 768;

function navigateTo(id) {
    if (isMobile()) view.closeDrawer();
    const path = `/app/${id}`;
    if (route.path !== path) router.push(path);
}
function onEscape(e) {
    if (e.key === 'Escape' && isMobile()) view.closeDrawer();
}
onMounted(() => document.addEventListener('keydown', onEscape));
onBeforeUnmount(() => document.removeEventListener('keydown', onEscape));
</script>

<template>
    <Teleport to="body">
        <div v-if="view.drawerOpen"
            class="mobile-drawer-backdrop hidden max-md:block"
            @click="view.closeDrawer()"></div>
    </Teleport>

    <aside class="drawer bg-bg-elev"
        :class="[view.drawerOpen ? 'is-open border-r border-line' : 'border-r-transparent']">
        <div class="flex h-full w-60 max-md:w-full flex-col">
            <nav class="flex flex-none flex-col gap-px p-2">
                <button v-for="app in topApps" :key="app.id" @click="navigateTo(app.id)"
                    class="relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-[13.5px] transition-colors"
                    :class="route.params.id === app.id
                        ? 'bg-bg-hi text-ink'
                        : 'text-muted hover:bg-bg-hi hover:text-ink'">
                    <span v-if="route.params.id === app.id"
                        class="absolute left-0 top-2 bottom-2 w-[2px] rounded-r bg-accent"></span>
                    <component :is="app.icon" :size="18" :stroke-width="1.7" class="shrink-0" />
                    <span class="truncate">{{ app.name }}</span>
                </button>
            </nav>

            <nav class="flex flex-1 min-h-0 flex-col gap-px overflow-y-auto p-2 pt-1">
                <div class="px-3.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                    应用
                </div>
                <button v-for="app in middleApps" :key="app.id" @click="navigateTo(app.id)"
                    class="relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-[13.5px] transition-colors"
                    :class="route.params.id === app.id
                        ? 'bg-bg-hi text-ink'
                        : 'text-muted hover:bg-bg-hi hover:text-ink'">
                    <span v-if="route.params.id === app.id"
                        class="absolute left-0 top-2 bottom-2 w-[2px] rounded-r bg-accent"></span>
                    <component :is="app.icon" :size="18" :stroke-width="1.7" class="shrink-0" />
                    <span class="truncate">{{ app.name }}</span>
                </button>
            </nav>

            <div class="flex flex-none flex-col gap-px border-t border-line p-2">
                <button @click="theme.toggle"
                    class="flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-[13.5px] text-muted transition-colors hover:bg-bg-hi hover:text-ink">
                    <component :is="theme.resolved === 'light' ? Moon : Sun" :size="18" :stroke-width="1.7" class="shrink-0" />
                    <span>{{ theme.resolved === 'light' ? '夜间' : '日间' }}</span>
                </button>
                <button v-for="app in bottomApps" :key="app.id" @click="navigateTo(app.id)"
                    class="relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-left text-[13.5px] transition-colors"
                    :class="route.params.id === app.id
                        ? 'bg-bg-hi text-ink'
                        : 'text-muted hover:bg-bg-hi hover:text-ink'">
                    <span v-if="route.params.id === app.id"
                        class="absolute left-0 top-2 bottom-2 w-[2px] rounded-r bg-accent"></span>
                    <component :is="app.icon" :size="18" :stroke-width="1.7" class="shrink-0" />
                    <span class="truncate">{{ app.name }}</span>
                </button>
            </div>
        </div>
    </aside>
</template>

<style scoped>
/* 桌面:flex 项,宽度 0 ↔ 240 动画;
   手机:fixed overlay,通过 transform 滑入. 两套行为靠 media query 切. */
.drawer {
    flex: none;
    width: 0;
    overflow: hidden;
    transition: width 0.2s ease;
}
.drawer.is-open { width: 240px; }

@media (max-width: 767px) {
    .mobile-drawer-backdrop {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        top: calc(46px + max(env(safe-area-inset-top), 0.5rem));
        z-index: 80;
        background: rgb(0 0 0 / 0.55);
    }
    .drawer {
        position: fixed;
        left: 0;
        top: calc(46px + max(env(safe-area-inset-top), 0.5rem));
        bottom: 0;
        z-index: 85;
        width: 240px; max-width: 80vw;
        transform: translateX(-100%);
        transition: transform 0.2s ease;
    }
    .drawer.is-open { transform: translateX(0); }
}
</style>
