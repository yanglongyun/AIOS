<script setup>
// notes 应用根 — 协调器
// ─────────────────────
// api.js     请求层
// utils.js   relTime / snippet
// ListPane   列表(置顶 + 普通 + 空态)
// Editor     全屏编辑器(自动保存防抖在父级实现)

import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AppsTrigger from '@/components/AppsTrigger.vue';
import ChatTrigger from '@/components/ChatTrigger.vue';
import * as nt from './api.js';

import ListPane from './ListPane.vue';
import Editor from './Editor.vue';

// ── 主状态 ────────────────────
const items = ref([]);
const loading = ref(false);
const errMsg = ref('');
const search = ref('');

const editing = ref(null);          // null = 列表态;否则是被编辑的 note 副本
const editingDirty = ref(false);
let saveTimer = null;
const editorRef = ref(null);

function setErr(label, e) { errMsg.value = `${label}: ${e?.message || e}`; }

// ── 数据 ──────────────────────
async function loadList() {
    loading.value = true;
    try {
        const data = await nt.listNotes();
        items.value = data.items || [];
        errMsg.value = '';
    } catch (e) { setErr('__T_NOTES_LOAD_FAILED__', e); }
    loading.value = false;
}

// ── 编辑器 进入/退出/保存 ─────
function openNote(item) {
    editing.value = { ...item };
    editingDirty.value = false;
    editorRef.value?.autoFocus?.();
}
function newNote() {
    editing.value = { id: null, title: '', body: '', pinned: 0, created_at: '', updated_at: '' };
    editingDirty.value = false;
    editorRef.value?.focusTitle?.();
}
async function closeEditor() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (editing.value && editingDirty.value) await persistEditing();
    editing.value = null;
    editingDirty.value = false;
}
async function persistEditing() {
    const e = editing.value;
    if (!e) return;
    if (!e.id && !e.title.trim() && !e.body.trim()) return;  // 空白新笔记不保存
    try {
        const r = await nt.saveNote(e);
        if (r?.item) editing.value = { ...editing.value, ...r.item };
        editingDirty.value = false;
        await loadList();
    } catch (err) { setErr('__T_NOTES_SAVE_FAILED__', err); }
}

// 编辑期间防抖自动保存
watch(() => editing.value && JSON.stringify({
    t: editing.value.title, b: editing.value.body, p: editing.value.pinned
}), (n, o) => {
    if (!editing.value || o === undefined) return;
    editingDirty.value = true;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => persistEditing(), 800);
});

// ── 卡片操作 ──────────────────
async function togglePin(item, ev) {
    ev?.stopPropagation();
    try { await nt.pinNote(item.id, item.pinned ? 0 : 1); await loadList(); }
    catch (e) { setErr('__T_NOTES_PIN_FAILED__', e); }
}
async function removeNote(item, ev) {
    ev?.stopPropagation();
    if (!confirm('__T_NOTES_DELETE_CONFIRM__')) return;
    try {
        await nt.deleteNote(item.id);
        if (editing.value?.id === item.id) editing.value = null;
        await loadList();
    } catch (e) { setErr('__T_NOTES_DELETE_FAILED__', e); }
}

// ── 键盘 ──────────────────────
function onKey(e) { if (e.key === 'Escape' && editing.value) closeEditor(); }

onMounted(() => {
    loadList();
    document.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKey);
});
</script>

<template>
    <div class="app-frame bg-[#faf9f5]">

        <!-- ── topbar ── -->
        <header class="flex h-16 flex-none items-center gap-2 bg-transparent px-4">
            <button v-if="editing" class="icon-btn lg" title="__T_NOTES_BACK_TO_LIST__" @click="closeEditor">
                <span class="msi">arrow_back</span>
            </button>
            <div v-if="!editing" class="ml-3 flex-none text-[20px] font-medium tracking-[-0.01em] text-ink max-md:hidden">
                __T_NOTES_TITLE__
            </div>

            <!-- 列表态:搜索 -->
            <div v-if="!editing"
                 class="flex h-11 max-w-[720px] flex-1 items-center gap-2 rounded-[22px] bg-bg-elev px-4 transition-[background,box-shadow] focus-within:bg-white focus-within:shadow-[var(--shadow-1)] max-md:max-w-none">
                <span class="msi sm text-muted">search</span>
                <input v-model="search" type="text" placeholder="__T_NOTES_SEARCH_PLACEHOLDER__"
                       class="min-w-0 flex-1 border-0 bg-transparent text-[14.5px] text-ink outline-none" />
            </div>

            <!-- 编辑态:操作 -->
            <div v-else class="flex flex-1 items-center gap-1">
                <button class="icon-btn"
                        :class="{ 'bg-blue-bg !text-blue-fg': editing.pinned }"
                        :title="editing.pinned ? '__T_NOTEBOOK_UNPIN__' : '__T_NOTEBOOK_PIN__'"
                        @click="editing.pinned = editing.pinned ? 0 : 1">
                    <span class="msi sm">push_pin</span>
                </button>
                <button v-if="editing.id" class="icon-btn" title="__T_COMMON_DELETE__" @click="removeNote(editing, $event)">
                    <span class="msi sm">delete</span>
                </button>
            </div>

            <div class="ml-auto flex items-center gap-1">
                <ChatTrigger />
                <AppsTrigger />
            </div>
        </header>

        <section class="flex flex-1 min-w-0 min-h-0 flex-col overflow-y-auto">
            <Editor v-if="editing"
                    ref="editorRef"
                    :note="editing"
                    :dirty="editingDirty" />

            <ListPane v-else
                      :items="items"
                      :search="search"
                      :loading="loading"
                      :err-msg="errMsg"
                      @new="newNote"
                      @open="openNote"
                      @pin="togglePin"
                      @remove="removeNote" />
        </section>
    </div>
</template>
