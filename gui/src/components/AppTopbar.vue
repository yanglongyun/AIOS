<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useViewStore } from '@/stores/view';

const view = useViewStore();
const route = useRoute();

// 直接复用 navGroups 的 label —— 已走 i18n 占位符,侧边栏和顶栏天然一致
const currentLabel = computed(() => {
    const all = [...view.navGroups.top, ...view.navGroups.apps, ...view.navGroups.bottom];
    return all.find(item => item.path === route.path)?.label || '';
});
</script>

<template>
    <header class="topbar">
        <button class="hamburger" @click="view.toggleDrawer" aria-label="菜单">
            <span class="msi">menu</span>
        </button>
        <h1 class="title">{{ currentLabel }}</h1>
    </header>
</template>

<style scoped>
/* Topbar is mobile-only — desktop renders nothing. */
.topbar { display: none; }

.hamburger {
    width: 40px; height: 40px;
    border: 0; padding: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--color-muted);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s, color .15s;
    flex: none;
}
.hamburger:hover { background: var(--color-bg-hi); color: var(--color-ink); }
.hamburger .msi { font-size: 22px; }

.title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--color-ink);
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
}

@media (max-width: 768px) {
    .topbar {
        display: flex; align-items: center;
        gap: 6px;
        position: fixed; top: 0; left: 0; right: 0;
        height: calc(52px + env(safe-area-inset-top));
        padding-top: env(safe-area-inset-top);
        padding-left: max(8px, env(safe-area-inset-left));
        padding-right: max(12px, env(safe-area-inset-right));
        background: var(--color-bg-elev);
        border-bottom: 1px solid var(--color-line);
        z-index: 60;
        flex: none;
    }
}
</style>
