import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { apps } from '../apps.js';

const SIDEBAR_KEY = 'iimos.sidebar.expanded';

function readStoredExpanded() {
    if (typeof window === 'undefined') return false;
    try {
        const v = localStorage.getItem(SIDEBAR_KEY);
        if (v === 'true') return true;
        if (v === 'false') return false;
    } catch {}
    return window.innerWidth >= 1024;
}

function buildNavGroups() {
    const groups = { top: [], apps: [], bottom: [] };
    for (const app of apps) {
        const g = app.group || 'apps';
        if (groups[g]) {
            groups[g].push({
                path: `/app/${app.id}`,
                label: app.name,
                msi: app.icon,
                kind: app.id,
            });
        }
    }
    return groups;
}

export const useViewStore = defineStore('view', () => {
    const drawerOpen = ref(readStoredExpanded());
    const navGroups = buildNavGroups();

    function toggleDrawer() { drawerOpen.value = !drawerOpen.value; }
    function closeDrawer() { drawerOpen.value = false; }
    function openDrawer() { drawerOpen.value = true; }

    watch(drawerOpen, (v) => {
        try { localStorage.setItem(SIDEBAR_KEY, String(v)); } catch {}
    });

    return { drawerOpen, navGroups, toggleDrawer, closeDrawer, openDrawer };
});
