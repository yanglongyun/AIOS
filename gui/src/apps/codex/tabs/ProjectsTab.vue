<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <!-- Level 1: years -->
    <template v-if="!currentPath">
      <div>
        <div class="text-[17px] font-bold">__T_CODEX_PROJECTS_TITLE__</div>
        <div class="text-[11.5px]" style="color:#6b5a46">
          {{ '__T_CODEX_PROJECTS_DESC__'.replace('{n}', String(data?.projects?.length || 0)) }}
        </div>
      </div>

      <div v-if="loading" class="text-[12px]" style="color:#8a7965">__T_CODEX_LOADING__</div>
      <div v-else-if="!data?.projects?.length" class="text-[12px]" style="color:#8a7965">__T_CODEX_PROJECTS_EMPTY__</div>
      <div v-else class="rounded-xl bg-white border overflow-hidden" style="border-color:rgba(140,100,60,0.12)">
        <button v-for="p in data.projects" :key="p.year"
          class="w-full text-left grid gap-3 items-center px-4 py-3 border-b last:border-b-0 bg-white hover:bg-[#fdf7e8] transition-colors"
          style="grid-template-columns: 1fr 100px 110px 16px;border-color:rgba(140,100,60,0.08)"
          @click="enterDir([p.year])">
          <div class="cc-mono text-[13px]" style="color:#2a1f13;font-weight:600">📅 {{ p.year }}</div>
          <div class="cc-mono text-right" style="font-size:11.5px;color:#4a3826">{{ '__T_CODEX_PROJECTS_SESSIONS__'.replace('{n}', String(p.sessionCount)) }}</div>
          <div class="cc-mono text-right" style="font-size:10.5px;color:#8a7965">{{ formatShortTime(p.lastActivity) }}</div>
          <div style="color:#8a7965">›</div>
        </button>
      </div>
    </template>

    <!-- Level 2+ -->
    <template v-else>
      <div class="flex items-center gap-1 flex-wrap text-[12px]">
        <button class="hover:underline" style="color:#5c4332" @click="currentPath = null">__T_CODEX_PROJECTS_ROOT__</button>
        <template v-for="(seg, i) in currentPath" :key="i">
          <span style="color:#8a7965">/</span>
          <button class="cc-mono"
            :style="i === currentPath.length - 1 ? 'color:#2a1f13;font-weight:600' : 'color:#5c4332'"
            :class="i < currentPath.length - 1 ? 'hover:underline' : ''"
            @click="currentPath = currentPath.slice(0, i + 1)">{{ seg }}</button>
        </template>
      </div>

      <div v-if="dirLoading" class="text-[12px]" style="color:#8a7965">__T_CODEX_LOADING__</div>
      <div v-else-if="!dirContents?.ok" class="text-[12px]" style="color:#b03a20">{{ dirContents?.error || '__T_CODEX_FILE_LOAD_FAILED__' }}</div>
      <template v-else>
        <!-- Subdirs -->
        <div v-if="dirContents.subdirs.length">
          <div class="text-[11px] font-bold uppercase tracking-wider mb-2" style="color:#8a7965">{{ '__T_CODEX_PROJECTS_DIR_SECTION__'.replace('{n}', String(dirContents.subdirs.length)) }}</div>
          <div class="rounded-xl bg-white border overflow-hidden" style="border-color:rgba(140,100,60,0.12)">
            <button v-for="d in dirContents.subdirs" :key="d.name"
              class="w-full text-left flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 bg-white hover:bg-[#fdf7e8] transition-colors"
              style="border-color:rgba(140,100,60,0.08)"
              @click="enterDir([...currentPath, d.name])">
              <span>📁</span>
              <span class="cc-mono text-[12px] truncate flex-1" style="color:#4a3826">{{ d.name }}</span>
              <span class="cc-mono text-[10.5px]" style="color:#8a7965">{{ formatShortTime(d.modified) }}</span>
              <span style="color:#8a7965">›</span>
            </button>
          </div>
        </div>

        <!-- Sessions -->
        <div v-if="dirContents.sessions.length">
          <div class="text-[11px] font-bold uppercase tracking-wider mb-2" style="color:#8a7965">{{ '__T_CODEX_PROJECTS_SESSION_SECTION__'.replace('{n}', String(dirContents.sessions.length)) }}</div>
          <div class="rounded-xl bg-white border overflow-hidden" style="border-color:rgba(140,100,60,0.12)">
            <button v-for="s in dirContents.sessions" :key="s.name"
              class="w-full text-left grid gap-3 items-center px-4 py-2.5 border-b last:border-b-0 bg-white hover:bg-[#fdf7e8] transition-colors"
              style="grid-template-columns: 1fr 80px 90px;border-color:rgba(140,100,60,0.08)"
              @click="openFile(s.name)">
              <div class="min-w-0">
                <div class="text-[12.5px] truncate" style="color:#2a1f13;font-weight:500">💬 {{ s.threadName || '__T_CODEX_PROJECTS_UNNAMED__' }}</div>
                <div class="cc-mono text-[10px] truncate" style="color:#8a7965">{{ s.sessionId.slice(0, 8) }}... · {{ s.name }}</div>
              </div>
              <div class="cc-mono text-right" style="font-size:11px;color:#8a7965">{{ formatSize(s.size) }}</div>
              <div class="cc-mono text-right" style="font-size:10.5px;color:#8a7965">{{ formatShortTime(s.modified) }}</div>
            </button>
          </div>
        </div>

        <div v-if="!dirContents.subdirs.length && !dirContents.sessions.length" class="text-[12px]" style="color:#8a7965">__T_CODEX_PROJECTS_DIR_EMPTY__</div>
      </template>
    </template>

    <FileViewerModal :open="!!viewingFilePath" :path="viewingFilePath" @close="viewingFilePath = null" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { formatShortTime, formatSize } from '../utils.js';
import FileViewerModal from './FileViewerModal.vue';

const props = defineProps({
  data: { type: Object, default: null },
  loading: { type: Boolean, default: false }
});

const currentPath = ref(null);
const dirContents = ref(null);
const dirLoading = ref(false);
const viewingFilePath = ref(null);

const enterDir = async (segments) => {
  currentPath.value = segments;
  await loadDir(segments);
};

const loadDir = async (segments) => {
  dirLoading.value = true;
  dirContents.value = null;
  try {
    const url = '/apps/codex/projects/dir?path=' + encodeURIComponent(segments.join('/'));
    dirContents.value = await (await fetch(url)).json();
  } catch (err) {
    dirContents.value = { ok: false, error: err?.message || String(err) };
  } finally {
    dirLoading.value = false;
  }
};

const openFile = (name) => {
  if (!currentPath.value) return;
  viewingFilePath.value = [...currentPath.value, name].join('/');
};

watch(currentPath, async (val) => {
  if (val && val.length) await loadDir(val);
});
</script>
