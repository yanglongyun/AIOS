<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useViewStore } from '@/stores/view';
import { useThemeStore } from '@/stores/theme';
import { useTasksStore } from '@/stores/tasks';

const router = useRouter();
const route = useRoute();
const view = useViewStore();
const theme = useThemeStore();
const tasks = useTasksStore();

const isLight = computed(() => theme.resolved === 'light');
const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

function navigateTo(path) {
    if (route.path !== path) router.push(path);
    if (isMobile()) view.closeDrawer();
}

function onScrim() { view.closeDrawer(); }
function onEscape(e) { if (e.key === 'Escape') view.closeDrawer(); }

onMounted(() => {
    tasks.startPolling(4000);
    document.addEventListener('keydown', onEscape);
});
onBeforeUnmount(() => {
    tasks.stopPolling();
    document.removeEventListener('keydown', onEscape);
});
</script>

<template>
    <aside class="rail" :class="{ expanded: view.drawerOpen }">

        <!-- Menu toggle (desktop only; mobile uses AppTopbar instead) -->
        <button class="ricon menu-row" @click="view.toggleDrawer" title="展开 / 收起">
            <span class="ico"><span class="msi">menu</span></span>
        </button>

        <!-- Group 1: top (Agent) — fixed, no heading -->
        <nav class="nav top-group">
            <button v-for="item in view.navGroups.top" :key="item.path"
                @click="navigateTo(item.path)"
                class="ricon"
                :class="{ active: route.path === item.path }"
                :title="item.label">
                <span class="ico">
                    <span class="msi" :class="{ filled: route.path === item.path }">{{ item.msi }}</span>
                </span>
                <span class="label">{{ item.label }}</span>
            </button>
        </nav>

        <!-- Group 2: apps (scrollable middle) — labelled -->
        <div class="apps-group">
            <div class="group-label">应用</div>
            <nav class="nav apps-list">
                <button v-for="item in view.navGroups.apps" :key="item.path"
                    @click="navigateTo(item.path)"
                    class="ricon"
                    :class="{ active: route.path === item.path }"
                    :title="item.label">
                    <span class="ico">
                        <span class="msi" :class="{ filled: route.path === item.path }">{{ item.msi }}</span>
                    </span>
                    <span class="label">{{ item.label }}</span>
                </button>
            </nav>
        </div>

        <!-- Group 3: bottom — theme toggle on top, then system entries -->
        <div class="bottom-group">
            <button class="ricon" @click="theme.toggle" :title="isLight ? '切到夜色' : '切到日间'">
                <span class="ico"><span class="msi">{{ isLight ? 'dark_mode' : 'light_mode' }}</span></span>
                <span class="label">{{ isLight ? '夜色' : '日间' }}</span>
            </button>

            <button v-for="item in view.navGroups.bottom" :key="item.path"
                @click="navigateTo(item.path)"
                class="ricon"
                :class="{ active: route.path === item.path }"
                :title="item.label">
                <span class="ico">
                    <span class="msi" :class="{
                        filled: route.path === item.path,
                        spin: item.kind === 'tasks' && tasks.runningCount > 0,
                    }">{{ item.msi }}</span>
                </span>
                <span class="label">{{ item.label }}</span>
                <span v-if="item.kind === 'tasks' && tasks.runningCount > 0"
                    class="badge run">{{ tasks.runningCount }}</span>
            </button>
        </div>
    </aside>

    <!-- Mobile-only scrim, hidden on desktop via opacity:0 -->
    <div class="scrim" :class="{ open: view.drawerOpen }" @click="onScrim"></div>
</template>

<style scoped>
/* ============ Rail container ============ */
.rail {
    grid-area: rail;
    background: var(--color-bg-elev);
    display: flex; flex-direction: column;
    padding: 14px 12px;
    gap: 4px;
    box-shadow: 1px 0 0 var(--color-line);
    overflow: hidden;
    width: 72px;
    transition: width .24s cubic-bezier(.2,.7,.2,1);
}
.rail.expanded { width: 240px; }

/* ============ Three sections ============ */
.top-group { flex: none; }

/* Middle section — labelled, scrolls when content exceeds available space */
.apps-group {
    flex: 1; min-height: 0;
    margin-top: 14px;
    display: flex; flex-direction: column;
    overflow: hidden;
}
.apps-list {
    flex: 1; min-height: 0;
    overflow-y: auto;
    padding-right: 2px;     /* breathing room for thin scrollbar */
}
.apps-list::-webkit-scrollbar { width: 6px; }
.apps-list::-webkit-scrollbar-thumb { background: var(--color-line-hi); border-radius: 999px; }

.group-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: transparent;
    padding: 0 14px 6px;
    height: 22px;
    box-sizing: border-box;
    position: relative;
    transition: color .18s ease;
}
/* Collapsed: render as a thin divider matching the .bottom-group border-top.
   Expanded: divider fades out and the "应用" caption fades in. */
.group-label::before {
    content: "";
    position: absolute;
    left: 0; right: 0; top: 50%;
    height: 1px;
    background: var(--color-line);
    transform: translateY(-50%);
    transition: opacity .18s ease;
}
.rail.expanded .group-label { color: var(--color-faint); }
.rail.expanded .group-label::before { opacity: 0; }

.bottom-group {
    flex: none;
    margin-top: 14px;
    padding-top: 8px;
    border-top: 1px solid var(--color-line);
    display: flex; flex-direction: column; gap: 4px;
}

/* ============ Row item (.ricon) ============ */
.ricon {
    display: flex; align-items: center; gap: 14px;
    height: 42px; width: 42px;
    padding: 0; border: 0; background: transparent; cursor: pointer;
    border-radius: 999px;
    color: var(--color-muted);
    transition: background .15s, color .15s, width .24s cubic-bezier(.2,.7,.2,1), padding .24s cubic-bezier(.2,.7,.2,1);
    position: relative; overflow: hidden; flex: none;
}
.ricon .ico {
    width: 42px; height: 42px;
    display: grid; place-items: center; flex: none;
}
.ricon .label {
    font-size: 14px; font-weight: 500; color: inherit;
    white-space: nowrap;
    opacity: 0; transform: translateX(-4px);
    transition: opacity .18s ease, transform .22s cubic-bezier(.2,.7,.2,1);
    pointer-events: none;
    flex: none;
}
.ricon .badge {
    margin-left: auto; margin-right: 8px;
    font-size: 11px; color: var(--color-muted);
    background: var(--color-bg-hi);
    padding: 1px 7px; border-radius: 999px;
    opacity: 0; transition: opacity .18s ease;
    flex: none;
}
.ricon .badge.run { background: var(--color-blue-bg); color: var(--color-blue-fg); }
.ricon:hover { background: var(--color-bg-hi); color: var(--color-ink); }
.ricon.active {
    background: var(--color-blue-bg);
    color: var(--color-accent);
    font-weight: 500;
}
.ricon.active .badge { background: #fff; color: var(--color-accent); }

.rail.expanded .ricon {
    width: 100%;
    padding-right: 6px;
}
.rail.expanded .ricon .label { opacity: 1; transform: translateX(0); transition-delay: .05s; }
.rail.expanded .ricon .badge { opacity: 1; transition-delay: .08s; }

/* spinning progress indicator */
.msi.spin { animation: ricon-spin 1.6s linear infinite; transform-origin: 50% 50%; }
@keyframes ricon-spin { to { transform: rotate(360deg); } }

/* ============ Menu toggle row (rail header) ============ */
.menu-row { margin-bottom: 8px; color: var(--color-ink); }
.menu-row:hover { background: var(--color-bg-hi); }

/* ============ Nav group ============ */
.nav { display: flex; flex-direction: column; gap: 4px; }

/* ============ Mobile overlay scrim ============ */
.scrim {
    position: fixed; inset: 0; z-index: 40;
    background: rgba(31, 31, 31, 0.32);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    opacity: 0; pointer-events: none;
    transition: opacity .2s ease;
}

/* ============ Mobile (≤768px) ============ */
@media (max-width: 768px) {
    /* Rail is fully hidden by default — slides in as an overlay card.
       Top offset accounts for the fixed topbar (52px + safe area). */
    .rail {
        position: fixed; left: 0;
        top: calc(52px + env(safe-area-inset-top));
        bottom: 0;
        z-index: 50;
        width: 280px;                          /* fixed mobile width */
        transform: translateX(-100%);          /* off-screen by default */
        transition: transform .26s cubic-bezier(.2,.7,.2,1), box-shadow .24s ease;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0);
        padding-top: 14px;
        padding-bottom: max(14px, env(safe-area-inset-bottom));
        padding-left: max(12px, env(safe-area-inset-left));
    }
    .rail.expanded {
        width: 280px;
        transform: translateX(0);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.20);
    }

    /* AppTopbar already shows menu + brand on mobile, hide the rail's header row */
    .rail .menu-row { display: none; }

    /* When the rail is visible on mobile, always show full-width rows + labels */
    .rail .ricon { width: 100%; padding-right: 6px; }
    .rail .ricon .label { opacity: 1; transform: translateX(0); transition: none; }
    .rail .ricon .badge { opacity: 1; transition: none; }

    .scrim.open { opacity: 1; pointer-events: auto; }
}
</style>
