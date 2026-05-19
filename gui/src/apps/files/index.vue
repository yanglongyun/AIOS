<script setup>
// files 应用根 — 协调器
// ────────────────────
// Topbar    顶栏
// Sidebar   星标 + 快捷
// 主区直接复用 components/files/* 一组现成组件
import { onMounted } from 'vue';
import { useViewStore } from '@/stores/view.js';
import { useFilesStore } from '@/stores/files';

import Topbar from './Topbar.vue';
import Sidebar from './Sidebar.vue';
import FilesToolbar from '@/components/files/FilesToolbar.vue';
import FileList from '@/components/files/FileList.vue';
import UploadProgress from '@/components/files/UploadProgress.vue';
import PreviewModal from '@/components/files/PreviewModal.vue';
import ActionSheet from '@/components/files/ActionSheet.vue';

const view = useViewStore();
const files = useFilesStore();

function pickShortcut(p) {
    files.navigate(p);
    if (window.innerWidth < 720) view.closeAppDrawer();
}

function onDragOver(e) { e.preventDefault(); files.isDragOver = true; }
function onDragLeave() { files.isDragOver = false; }
function onDrop(e) {
    e.preventDefault();
    files.isDragOver = false;
    const list = e.dataTransfer?.files;
    if (list?.length) files.uploadFiles(list);
}

onMounted(() => { files.ensureLoaded?.(); });
</script>

<template>
    <div class="app-frame relative bg-bg"
         @dragover="onDragOver"
         @dragleave="onDragLeave"
         @drop="onDrop">
        <Topbar />

        <div class="app-body">
            <Transition name="mask">
                <div v-if="view.appDrawerOpen" class="app-side-mask" @click="view.closeAppDrawer()" />
            </Transition>

            <aside class="app-side" :class="{ collapsed: !view.appDrawerOpen }">
                <div class="app-side-inner">
                    <Sidebar @pick="pickShortcut" />
                </div>
            </aside>

            <section class="files-pane relative flex flex-1 min-w-0 min-h-0 flex-col overflow-hidden rounded-2xl bg-white m-2 ml-0 max-md:m-1 max-md:rounded-[14px]">
                <FilesToolbar />
                <FileList />
                <UploadProgress />

                <div v-if="files.isDragOver"
                     class="pointer-events-none absolute inset-2 z-20 grid place-items-center rounded-xl border-2 border-dashed border-accent bg-accent/[0.06]">
                    <div class="rounded-[20px] bg-white px-4 py-2.5 text-sm font-medium text-accent shadow-[var(--shadow-2)]">
                        松手放进当前目录
                    </div>
                </div>

                <PreviewModal />
                <ActionSheet />
            </section>
        </div>
    </div>
</template>
