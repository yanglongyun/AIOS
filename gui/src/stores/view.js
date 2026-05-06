// 全局视图状态:抽屉开关 + 当前路由对应的 app(用于 AppHeader 标题).
//
// 切应用走 AppDrawer 里的 nav 列表(由 apps.js 派生).
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { apps } from '../apps.js';

export const useViewStore = defineStore('view', () => {
    // 桌面默认打开(占据左侧),手机默认关闭(用户点 ☰ 才浮出)
    const drawerOpen = ref(typeof window !== 'undefined' && window.innerWidth >= 768);
    const route = useRoute();

    const currentApp = computed(() => {
        const id = route.params?.id;
        return id ? apps.find((a) => a.id === id) || null : null;
    });

    function openDrawer()  { drawerOpen.value = true; }
    function closeDrawer() { drawerOpen.value = false; }
    function toggleDrawer(){ drawerOpen.value = !drawerOpen.value; }

    return { drawerOpen, currentApp, openDrawer, closeDrawer, toggleDrawer };
});
