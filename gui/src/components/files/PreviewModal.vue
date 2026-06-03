<script setup>
import { useFilesStore, humanSize } from '@/stores/files';
const files = useFilesStore();
</script>

<template>
    <div v-if="files.preview" class="scrim fade-enter" @click.self="files.closePreview">
        <div class="modal sheet-enter sm:animate-none safe-top safe-bottom">
            <header class="head">
                <div class="title-block">
                    <div class="title">{{ files.preview.name }}</div>
                    <div class="meta">{{ files.preview.mime || '未知类型' }} · {{ humanSize(files.preview.size) }}</div>
                </div>
                <div class="actions">
                    <button class="dl-btn" @click="files.downloadPreview">下载</button>
                    <button class="close-btn" @click="files.closePreview">
                        <span class="msi sm">close</span>
                    </button>
                </div>
            </header>

            <div class="body">
                <div v-if="files.preview.kind === 'loading'" class="state">加载中…</div>
                <div v-else-if="files.preview.kind === 'error'" class="state error">{{ files.preview.error }}</div>
                <pre v-else-if="files.preview.kind === 'text'" class="text-view">{{ files.preview.content }}</pre>
                <div v-else-if="files.preview.kind === 'image'" class="image-view">
                    <img :src="files.preview.url" />
                </div>
                <div v-else class="state empty">
                    <span class="msi" style="font-size:36px;color:var(--text-3)">description</span>
                    <div>无法预览此文件类型</div>
                    <button class="dl-btn-primary" @click="files.downloadPreview">下载查看</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.scrim {
    position: fixed; inset: 0; z-index: 50;
    display: flex; align-items: flex-end; justify-content: center;
    background: rgba(1, 5, 12, 0.62);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}
@media (min-width: 640px) {
    .scrim { align-items: center; }
}

.modal {
    width: 100%;
    max-width: 48rem;
    height: 100%;
    background: var(--bg-card);
    border: 1px solid var(--line);
    display: flex; flex-direction: column;
    overflow: hidden;
}
@media (min-width: 640px) {
    .modal { height: 85vh; border-radius: 12px; box-shadow: var(--shadow-3); }
}

.head {
    flex: none;
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--line);
}
.title-block { min-width: 0; }
.title {
    font-size: 13.5px;
    color: var(--text);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.meta {
    font-size: 11px;
    color: var(--text-3);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.actions { flex: none; display: flex; align-items: center; gap: 4px; }

.dl-btn {
    padding: 0 12px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: var(--bg-elev);
    color: var(--text-2);
    font-size: 12px;
    cursor: pointer;
    transition: background .12s, border-color .12s, color .12s;
}
.dl-btn:hover { background: var(--bg-hover); border-color: var(--accent); color: var(--accent-hi); }

.close-btn {
    width: 30px; height: 30px;
    display: inline-flex; align-items: center; justify-content: center;
    border: 0; background: transparent;
    color: var(--text-3);
    border-radius: 8px;
    cursor: pointer;
    transition: background .12s, color .12s;
}
.close-btn:hover { background: var(--bg-hover); color: var(--text); }

.body { flex: 1; min-height: 0; overflow: auto; }

.state {
    height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px;
    padding: 16px;
    color: var(--text-2);
    font-size: 13px;
}
.state.error { color: var(--bad); }

.text-view {
    margin: 0;
    padding: 16px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text);
    white-space: pre-wrap; word-break: break-all;
}
.image-view {
    height: 100%;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
}
.image-view img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.dl-btn-primary {
    padding: 0 16px;
    height: 36px;
    border: 0;
    border-radius: 999px;
    background: var(--accent);
    color: #001019;
    font-size: 13px; font-weight: 700;
    cursor: pointer;
    transition: background .15s, box-shadow .15s;
}
.dl-btn-primary:hover { background: var(--accent-hi); box-shadow: 0 0 18px rgba(0, 215, 255, 0.35); }
</style>
