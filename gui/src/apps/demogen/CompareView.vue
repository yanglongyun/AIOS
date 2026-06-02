<script setup>
import { ref, computed, onMounted } from 'vue';
import { getProject, fileUrl } from './api.js';

const props = defineProps({ projectId: { type: Number, required: true } });
const emit = defineEmits(['back', 'open-work']);

const project = ref(null);
const works = ref([]);
const errMsg = ref('');
const cols = ref(2);
const nonce = ref(0); // bump to force-refresh all iframes

const doneWorks = computed(() => works.value.filter((w) => w.status === 'done' && w.entry_path));

async function load() {
  errMsg.value = '';
  try {
    const res = await getProject(props.projectId);
    project.value = res.project;
    works.value = res.works ?? [];
  } catch (e) {
    errMsg.value = e?.body?.message ?? e.message ?? '加载失败';
  }
}

function srcOf(work) {
  return `${fileUrl(work.entry_path)}&v=${nonce.value}`;
}
function refreshAll() { nonce.value += 1; }
function openTab(work) { window.open(fileUrl(work.entry_path), '_blank'); }

onMounted(load);
</script>

<template>
  <div class="cmp-root">
    <header class="cmp-header">
      <button class="back-btn" @click="$emit('back')"><span class="msi sm">arrow_back</span></button>
      <div class="cmp-title">
        <h1>并排对比</h1>
        <span class="cmp-count">{{ doneWorks.length }} 套已完成</span>
      </div>
      <div class="cmp-tools">
        <div class="cmp-cols">
          <button v-for="n in [1, 2, 3]" :key="n" :class="{ active: cols === n }" @click="cols = n">{{ n }}</button>
        </div>
        <button class="btn-ghost" @click="refreshAll"><span class="msi sm">refresh</span>刷新</button>
      </div>
    </header>

    <div v-if="errMsg" class="cmp-err">{{ errMsg }}</div>

    <div v-if="!doneWorks.length" class="cmp-empty">
      <span class="msi xl" style="color:#38bdf8;opacity:.35">grid_view</span>
      <p>还没有已完成的 Demo 可对比</p>
    </div>

    <div v-else class="cmp-grid" :style="{ '--cols': cols }">
      <section v-for="work in doneWorks" :key="work.id + '-' + nonce" class="cmp-cell">
        <div class="cmp-cell-bar">
          <div class="cmp-cell-meta">
            <strong>{{ work.name }}</strong>
            <span>{{ work.angle }}</span>
          </div>
          <div class="cmp-cell-actions">
            <button title="改一改 / 查看日志" @click="$emit('open-work', work)"><span class="msi sm">edit</span></button>
            <button title="新标签打开" @click="openTab(work)"><span class="msi sm">open_in_new</span></button>
          </div>
        </div>
        <iframe
          :src="srcOf(work)"
          class="cmp-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          loading="lazy"
        />
      </section>
    </div>
  </div>
</template>

<style scoped>
.cmp-root { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.cmp-header { flex: none; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #2a2340; background: #13101a; }
.back-btn { background: transparent; border: 0; color: #7a6f99; cursor: pointer; display: flex; padding: 6px; border-radius: 8px; }
.back-btn:hover { background: #211c30; color: #e2dff0; }
.cmp-title { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 10px; }
.cmp-title h1 { margin: 0; font-size: 17px; font-weight: 750; }
.cmp-count { font-size: 12px; color: #5a5278; }
.cmp-tools { display: flex; gap: 8px; align-items: center; }
.cmp-cols { display: flex; background: #211c30; border-radius: 8px; padding: 2px; gap: 2px; }
.cmp-cols button { border: 0; background: transparent; color: #7a6f99; font: inherit; font-size: 12.5px; font-weight: 650; width: 28px; height: 26px; border-radius: 6px; cursor: pointer; }
.cmp-cols button.active { background: #7c3aed; color: #fff; }
.btn-ghost { display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: 8px; background: #2a2340; color: #c4b5fd; font: inherit; font-size: 12.5px; font-weight: 650; cursor: pointer; padding: 7px 12px; }
.btn-ghost:hover { background: #34296a; }
.cmp-err { background: #3b0d0d; color: #f87171; padding: 8px 16px; font-size: 12.5px; }
.cmp-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #4d4468; }
.cmp-empty p { margin: 0; font-size: 14px; }

.cmp-grid {
  flex: 1; min-height: 0; overflow-y: auto; padding: 14px;
  display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 14px;
  align-content: start;
}
.cmp-cell { display: flex; flex-direction: column; background: #17131f; border: 1px solid #2a2340; border-radius: 12px; overflow: hidden; height: clamp(360px, 70vh, 760px); }
.cmp-cell-bar { flex: none; display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-bottom: 1px solid #2a2340; background: #13101a; }
.cmp-cell-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.cmp-cell-meta strong { font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cmp-cell-meta span { font-size: 11px; color: #7a6f99; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cmp-cell-actions { display: flex; gap: 2px; flex: none; }
.cmp-cell-actions button { background: transparent; border: 0; color: #7a6f99; cursor: pointer; display: flex; padding: 4px; border-radius: 6px; }
.cmp-cell-actions button:hover { background: #2a2340; color: #c4b5fd; }
.cmp-iframe { flex: 1; width: 100%; border: 0; background: #fff; }

@media (max-width: 768px) {
  .cmp-grid { grid-template-columns: 1fr; }
}
</style>
