<script setup>
// xterm 容器 + 实例管理。
// 父级通过 ref 调用方法,不直接持有 xterm 实例。
import { onBeforeUnmount, ref } from 'vue';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

const emit = defineEmits(['input']);

const wrapEl = ref(null);
const insts = new Map();   // id -> { term, fit }
const buf = new Map();     // id -> 缓冲输出 (xterm 还没 mount 时)
let activeId = '';

// ── 主题 ────────────────────────────
const TERM_THEME = {
    background: '#020714', foreground: '#e8f8ff',
    cursor: '#00d7ff', cursorAccent: '#020714',
    selectionBackground: 'rgba(0,215,255,0.25)',
    black: '#0b2138', red: '#ff3f6e', green: '#00ffa3', yellow: '#ffe66d',
    blue: '#00d7ff', magenta: '#c77dff', cyan: '#7cf4ff', white: '#8db8d9',
    brightBlack: '#527da0', brightRed: '#ff6b8e', brightGreen: '#5cffc0',
    brightYellow: '#fff3a0', brightBlue: '#7cf4ff', brightMagenta: '#e0aaff',
    brightCyan: '#aefbff', brightWhite: '#e8f8ff'
};

// ── 实例 ────────────────────────────
function getOrCreate(id) {
    if (insts.has(id)) return insts.get(id);
    const term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: 'JetBrains Mono, ui-monospace, Menlo, Monaco, Consolas, monospace',
        scrollback: 5000,
        theme: TERM_THEME
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.onData((data) => {
        if (id !== activeId) return;
        emit('input', { id, data });
    });
    insts.set(id, { term, fit });
    return insts.get(id);
}

function flushBuf(id) {
    const pending = buf.get(id);
    if (!pending) return;
    const inst = insts.get(id);
    if (!inst) return;
    inst.term.write(pending);
    buf.delete(id);
}

function mount(id) {
    const wrap = wrapEl.value;
    if (!wrap || !id) return;
    for (const [tid, { term }] of insts.entries()) {
        if (term.element) term.element.style.display = (tid === id) ? '' : 'none';
    }
    const inst = getOrCreate(id);
    if (!inst.term.element) inst.term.open(wrap);
    flushBuf(id);
    setTimeout(() => inst.fit.fit(), 0);
}

// ── 父级调用接口 ─────────────────────
function setActive(id) {
    activeId = id;
    mount(id);
}

function write(id, output) {
    if (!id || !output) return;
    const inst = insts.get(id);
    if (inst?.term.element) inst.term.write(output);
    else buf.set(id, (buf.get(id) || '') + output);
}

function resize(id, cols, rows) {
    const inst = getOrCreate(id);
    if (cols && rows) {
        inst.term.resize(cols, rows);
        if (id === activeId) inst.fit.fit();
    }
}

function dispose(id) {
    insts.get(id)?.term.dispose();
    insts.delete(id);
    buf.delete(id);
}

function pruneExcept(ids) {
    const keep = new Set(ids);
    for (const tid of [...insts.keys()]) {
        if (!keep.has(tid)) dispose(tid);
    }
}

function fitActive() {
    insts.get(activeId)?.fit.fit();
}

function getDims(id = activeId) {
    const inst = insts.get(id);
    if (!inst) return null;
    return { cols: inst.term.cols, rows: inst.term.rows };
}

onBeforeUnmount(() => {
    for (const { term } of insts.values()) term.dispose();
    insts.clear();
    buf.clear();
});

defineExpose({ setActive, write, resize, dispose, pruneExcept, fitActive, getDims });
</script>

<template>
    <section class="flex flex-1 min-w-0 min-h-0 bg-bg">
        <div ref="wrapEl" class="term-host flex-1 min-w-0 min-h-0 px-1 pb-1 pl-2 pt-2"></div>
    </section>
</template>

<style scoped>
.term-host :deep(.xterm-viewport) { background: var(--bg) !important; }
</style>
