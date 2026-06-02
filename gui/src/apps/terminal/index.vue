<script setup>
// terminal 应用根 — 协调器
// ───────────────────────
// Topbar    顶栏
// Sidebar   会话列表 + 新建按钮
// Pane      xterm 容器 + 实例管理(通过 ref 调用)

import { onActivated, onMounted, ref, watch } from 'vue';
import { useViewStore } from '@/stores/view.js';
import { send, on, wsStatus } from '@/system/ws.js';

import Topbar from './Topbar.vue';
import Sidebar from './Sidebar.vue';
import Pane from './Pane.vue';

const view = useViewStore();
const tabs = ref([]);
const activeId = ref('');
const paneRef = ref(null);

// ── WS 操作 ─────────────────────────
function refreshList() { send({ type: 'terminal.list', to: 'desktop', data: {} }); }
function addTab() { send({ type: 'terminal.create', to: 'desktop', data: {} }); }
function closeTab(id, e) {
    e?.stopPropagation();
    send({ type: 'terminal.close', to: 'desktop', data: { terminalId: id } });
}
function pickTab(id) {
    if (!id || id === activeId.value) return;
    activeId.value = id;
    send({ type: 'terminal.activate', to: 'desktop', data: { terminalId: id } });
    if (window.innerWidth < 720) view.closeAppDrawer();
    paneRef.value?.setActive(id);
}

function sendInput({ id, data }) {
    send({ type: 'data.input', to: 'desktop', data: { terminalId: id, input: data } });
}
function sendResize(id = activeId.value) {
    if (!id) return;
    const dims = paneRef.value?.getDims(id);
    if (!dims) return;
    send({ type: 'system.resize', to: 'desktop', data: { terminalId: id, cols: dims.cols, rows: dims.rows } });
}

// ── tabs 同步 ───────────────────────
function setTabs(items, preferredId) {
    tabs.value = items || [];
    paneRef.value?.pruneExcept(items.map((it) => it.id));
    const fallback = preferredId || items.find((it) => it.isActive)?.id || items[0]?.id || '';
    if (fallback && fallback !== activeId.value) {
        activeId.value = fallback;
        setTimeout(() => paneRef.value?.setActive(fallback), 0);
    } else if (activeId.value) {
        setTimeout(() => paneRef.value?.setActive(activeId.value), 0);
    }
}

// ── 生命周期 ─────────────────────────
onMounted(() => {
    on('terminal.list', (msg) => setTabs(msg.data?.terminals || [], msg.data?.activeTerminalId));
    on('terminal.created', (msg) => {
        const t = msg.data?.terminal;
        if (!t?.id) return;
        const next = [...tabs.value.filter((it) => it.id !== t.id), t];
        setTabs(next, msg.data?.activeTerminalId || t.id);
    });
    on('terminal.closed', (msg) => {
        setTabs(tabs.value.filter((it) => it.id !== msg.data?.terminalId), msg.data?.activeTerminalId || '');
    });
    on('terminal.activated', (msg) => {
        const id = msg.data?.terminalId;
        if (!id) return;
        activeId.value = id;
        paneRef.value?.setActive(id);
    });
    on('data.output', (msg) => paneRef.value?.write(msg.data?.terminalId, msg.data?.output));
    on('system.init', (msg) => {
        const id = msg.data?.terminalId || activeId.value;
        if (!id) return;
        paneRef.value?.resize(id, msg.data?.cols, msg.data?.rows);
    });
    on('open', () => refreshList());
    if (wsStatus.value === 'connected') refreshList();
});

watch(() => view.appDrawerOpen, () => {
    setTimeout(() => { paneRef.value?.fitActive(); sendResize(); }, 200);
});

window.addEventListener('resize', () => {
    paneRef.value?.fitActive();
    sendResize();
});

onActivated(() => { setTimeout(() => paneRef.value?.setActive(activeId.value), 0); });
</script>

<template>
    <div class="app-frame">
        <Topbar />

        <div class="app-body">
            <Transition name="mask">
                <div v-if="view.appDrawerOpen" class="app-side-mask" @click="view.closeAppDrawer()" />
            </Transition>

            <aside class="app-side" :class="{ collapsed: !view.appDrawerOpen }">
                <div class="app-side-inner">
                    <Sidebar
                        :tabs="tabs"
                        :active-id="activeId"
                        @add="addTab"
                        @pick="pickTab"
                        @close="closeTab" />
                </div>
            </aside>

            <Pane ref="paneRef" @input="sendInput" />
        </div>
    </div>
</template>
