<template>
  <div class="h-full overflow-y-auto cc-thin-scroll px-6 py-5 space-y-4">
    <!-- Level 1: root list of encoded project dirs -->
    <template v-if="!currentPath">
      <div>
        <div class="text-[17px] font-bold">__T_CLAUDE_PROJECTS_TITLE__</div>
        <div class="text-[11.5px]" style="color:#6b5a46">
          {{ '__T_CLAUDE_PROJECTS_DESC__'.replace('{n}', String(data?.projects?.length || 0)) }}
        </div>
      </div>

      <div v-if="loading" class="text-[12px]" style="color:#8a7965">__T_CLAUDE_LOADING__</div>
      <div v-else-if="!data?.projects?.length" class="text-[12px]" style="color:#8a7965">__T_CLAUDE_PROJECTS_EMPTY__</div>
      <div v-else class="rounded-xl bg-white border overflow-hidden" style="border-color:rgba(140,100,60,0.12)">
        <button v-for="p in data.projects" :key="p.dirName"
          class="w-full text-left grid gap-3 items-center px-4 py-3 border-b last:border-b-0 bg-white hover:bg-[#fdf7e8] transition-colors"
          style="grid-template-columns: 1fr 90px 70px 110px 16px;border-color:rgba(140,100,60,0.08)"
          @click="enterDir([p.dirName])">
          <div class="min-w-0">
            <div class="text-[12.5px] truncate" style="color:#2a1f13;font-weight:500">📁 {{ p.cwd }}</div>
            <div class="cc-mono text-[10px] truncate mt-0.5" style="color:#8a7965">{{ p.dirName }}</div>
          </div>
          <div class="cc-mono text-right" style="font-size:11px;color:#4a3826">{{ '__T_CLAUDE_PROJECTS_SESSION_COUNT__'.replace('{n}', String(p.sessionCount)) }}</div>
          <div class="cc-mono text-right" style="font-size:10.5px;color:#8a7965">{{ formatSize(p.totalSize) }}</div>
          <div class="cc-mono text-right" style="font-size:10.5px;color:#8a7965">{{ formatShortTime(p.lastActivity) }}</div>
          <div style="color:#8a7965">›</div>
        </button>
      </div>
    </template>

    <!-- Level 2+: contents of a dir -->
    <template v-else>
      <div class="flex items-center gap-1 flex-wrap text-[12px]">
        <button class="hover:underline" style="color:#5c4332" @click="currentPath = null">__T_CLAUDE_PROJECTS_ROOT__</button>
        <template v-for="(seg, i) in currentPath" :key="i">
          <span style="color:#8a7965">/</span>
          <button class="cc-mono truncate max-w-[260px]"
            :style="i === currentPath.length - 1 ? 'color:#2a1f13;font-weight:600' : 'color:#5c4332'"
            :class="i < currentPath.length - 1 ? 'hover:underline' : ''"
            @click="currentPath = currentPath.slice(0, i + 1)">{{ seg }}</button>
        </template>
      </div>

      <div v-if="dirLoading" class="text-[12px]" style="color:#8a7965">__T_CLAUDE_LOADING__</div>
      <div v-else-if="!dirContents?.ok" class="text-[12px]" style="color:#b03a20">{{ dirContents?.error || '__T_CLAUDE_LOAD_FAILED__' }}</div>
      <template v-else>
        <!-- Human-friendly header when we're at a project root -->
        <div v-if="dirContents.isRootProject" style="padding-bottom:4px">
          <div class="text-[15px] font-bold truncate">{{ leafName(dirContents.cwd) }}</div>
          <div class="cc-mono text-[10.5px] mt-0.5" style="color:#8a7965">{{ '__T_CLAUDE_PROJECTS_DECODED_CWD__'.replace('{cwd}', dirContents.cwd) }}</div>
        </div>

        <!-- Subdirs -->
        <div v-if="dirContents.subdirs.length">
          <div class="text-[11px] font-bold uppercase tracking-wider mb-2" style="color:#8a7965">{{ '__T_CLAUDE_PROJECTS_DIR_SECTION__'.replace('{n}', String(dirContents.subdirs.length)) }}</div>
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
          <div class="text-[11px] font-bold uppercase tracking-wider mb-2" style="color:#8a7965">{{ '__T_CLAUDE_PROJECTS_SESSIONS_SECTION__'.replace('{n}', String(dirContents.sessions.length)) }}</div>
          <div class="rounded-xl bg-white border overflow-hidden" style="border-color:rgba(140,100,60,0.12)">
            <button v-for="s in dirContents.sessions" :key="s.sessionId"
              class="w-full text-left grid gap-3 items-center px-4 py-2.5 border-b last:border-b-0 bg-white hover:bg-[#fdf7e8] transition-colors"
              style="grid-template-columns: 110px 1fr 80px 70px;border-color:rgba(140,100,60,0.08)"
              @click="openFile(s.sessionId + '.jsonl')">
              <div class="cc-mono" style="font-size:11px;color:#6b5a46">{{ formatShortTime(s.lastTs) }}</div>
              <div class="min-w-0">
                <div class="text-[12.5px] truncate" style="color:#2a1f13;font-weight:500">{{ s.firstPrompt || '__T_CLAUDE_PROJECTS_BLANK__' }}</div>
                <div class="cc-mono text-[10px] truncate" style="color:#8a7965">
                  {{ s.sessionId.slice(0, 8) }}... · {{ s.model || '__T_CLAUDE_PROJECTS_UNKNOWN_MODEL__' }}{{ s.gitBranch ? ' · ' + s.gitBranch : '' }}
                </div>
              </div>
              <div class="cc-mono text-right" style="font-size:11px;color:#8a7965">{{ '__T_CLAUDE_PROJECTS_MESSAGE_COUNT__'.replace('{n}', String(s.messageCount)) }}</div>
              <div class="cc-mono text-right" style="font-size:10.5px;color:#8a7965">{{ formatSize(s.sizeBytes) }}</div>
            </button>
          </div>
        </div>

        <!-- Other files -->
        <div v-if="dirContents.files.length">
          <div class="text-[11px] font-bold uppercase tracking-wider mb-2" style="color:#8a7965">{{ '__T_CLAUDE_PROJECTS_FILES_SECTION__'.replace('{n}', String(dirContents.files.length)) }}</div>
          <div class="rounded-xl bg-white border overflow-hidden" style="border-color:rgba(140,100,60,0.12)">
            <button v-for="f in dirContents.files" :key="f.name"
              class="w-full text-left flex items-center gap-3 px-4 py-2 border-b last:border-b-0 bg-white hover:bg-[#fdf7e8] transition-colors"
              style="border-color:rgba(140,100,60,0.08)"
              @click="openFile(f.name)">
              <span>📄</span>
              <span class="cc-mono text-[12px] truncate flex-1" style="color:#4a3826">{{ f.name }}</span>
              <span class="cc-mono text-[10.5px]" style="color:#8a7965">{{ formatSize(f.size) }}</span>
              <span class="cc-mono text-[10.5px]" style="color:#8a7965">{{ formatShortTime(f.modified) }}</span>
            </button>
          </div>
        </div>

        <div v-if="!dirContents.subdirs.length && !dirContents.sessions.length && !dirContents.files.length"
          class="text-[12px]" style="color:#8a7965">__T_CLAUDE_PROJECTS_DIR_EMPTY__</div>
      </template>
    </template>

    <FileViewerModal :open="!!viewingFilePath" :path="viewingFilePath" @close="viewingFilePath = null" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { formatShortTime } from '../utils.js';
import FileViewerModal from './FileViewerModal.vue';

const props = defineProps({
  data: { type: Object, default: null },
  loading: { type: Boolean, default: false }
});

const currentPath = ref(null); // null = level 1 root, else array of segments
const dirContents = ref(null);
const dirLoading = ref(false);
const viewingFilePath = ref(null);

const openFile = (name) => {
  if (!currentPath.value) return;
  viewingFilePath.value = [...currentPath.value, name].join('/');
};

const enterDir = async (segments) => {
  currentPath.value = segments;
  await loadDir(segments);
};

const loadDir = async (segments) => {
  dirLoading.value = true;
  dirContents.value = null;
  try {
    const url = '/apps/claude-code/projects/dir?path=' + encodeURIComponent(segments.join('/'));
    dirContents.value = await (await fetch(url)).json();
  } catch (err) {
    dirContents.value = { ok: false, error: err?.message || String(err) };
  } finally {
    dirLoading.value = false;
  }
};

watch(currentPath, async (val) => {
  if (val && val.length) await loadDir(val);
});

const formatSize = (n) => {
  if (!n) return '0';
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + 'MB';
  if (n >= 1024) return (n / 1024).toFixed(1) + 'KB';
  return n + 'B';
};

const leafName = (cwd) => (cwd || '').split('/').filter(Boolean).pop() || cwd || '';
</script>
