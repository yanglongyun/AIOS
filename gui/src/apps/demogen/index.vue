<script setup>
import { ref, shallowRef, computed } from 'vue';
import AppHub from '@/components/AppHub.vue';
import AskAI from '@/components/AskAI.vue';
import ProjectList   from './ProjectList.vue';
import ProjectDetail from './ProjectDetail.vue';
import WorkDetail    from './WorkDetail.vue';
import CompareView   from './CompareView.vue';
import { getProject } from './api.js';

// ── Navigation stack ──────────────────────────────────────────────────────────
// Each frame: { view: 'list'|'project'|'work'|'compare', projectId?, work?, project? }
const stack = ref([{ view: 'list' }]);
const frame = computed(() => stack.value[stack.value.length - 1]);

function push(f) { stack.value = [...stack.value, f]; }
function pop()   { if (stack.value.length > 1) stack.value = stack.value.slice(0, -1); }

// ── Handlers ──────────────────────────────────────────────────────────────────
function openProject(project) {
  push({ view: 'project', projectId: project.id, project });
}

function openWork(work) {
  const f = frame.value;
  push({ view: 'work', work: { ...work }, project: f.project ?? null, projectId: f.projectId });
}

function openCompare() {
  const f = frame.value;
  push({ view: 'compare', projectId: f.projectId, project: f.project ?? null });
}

async function reloadWork() {
  const f = frame.value;
  if (f.view !== 'work' || !f.work) return;
  try {
    const res = await getProject(f.work.project_id ?? f.projectId);
    const fresh = (res.works ?? []).find(w => w.id === f.work.id);
    if (fresh) {
      // mutate frame work in place so WorkDetail's watch triggers
      Object.assign(f.work, fresh);
    }
  } catch {}
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
const breadcrumbs = computed(() => {
  return stack.value.map((f, i) => {
    if (f.view === 'list')    return { label: 'Demo 生成器', idx: i };
    if (f.view === 'project') return { label: f.project?.title || f.project?.feature || '项目', idx: i };
    if (f.view === 'work')    return { label: f.work?.name || '作品', idx: i };
    if (f.view === 'compare') return { label: '并排对比', idx: i };
    return { label: '...', idx: i };
  });
});
function navTo(idx) {
  if (idx >= stack.value.length - 1) return;
  stack.value = stack.value.slice(0, idx + 1);
}
</script>

<template>
  <div class="dg-shell">

    <!-- Topbar -->
    <header class="dg-topbar">
      <nav class="dg-breadcrumb">
        <template v-for="(crumb, i) in breadcrumbs" :key="crumb.idx">
          <span v-if="i > 0" class="dg-sep msi sm">chevron_right</span>
          <button
            class="dg-crumb"
            :class="{ active: i === breadcrumbs.length - 1 }"
            @click="navTo(crumb.idx)"
          >{{ crumb.label }}</button>
        </template>
      </nav>
      <div style="display:flex;align-items:center;gap:4px;flex:none">
        <AskAI />
        <AppHub />
      </div>
    </header>

    <!-- View outlet -->
    <ProjectList
      v-if="frame.view === 'list'"
      @open="openProject"
    />

    <ProjectDetail
      v-else-if="frame.view === 'project'"
      :project-id="frame.projectId"
      @back="pop"
      @open-work="openWork"
      @open-compare="openCompare"
    />

    <CompareView
      v-else-if="frame.view === 'compare'"
      :project-id="frame.projectId"
      @back="pop"
      @open-work="openWork"
    />

    <WorkDetail
      v-else-if="frame.view === 'work'"
      :work="frame.work"
      :project="frame.project"
      @back="pop"
      @reload="reloadWork"
    />

  </div>
</template>

<style scoped>
.dg-shell {
  flex: 1; min-width: 0; min-height: 0;
  display: flex; flex-direction: column;
  background: #0f0d14; color: #e2dff0; font-family: inherit;
}

/* Topbar */
.dg-topbar {
  flex: none; height: 52px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 0 16px;
  background: #17131f; border-bottom: 1px solid #2a2340;
}

/* Breadcrumb */
.dg-breadcrumb { display: flex; align-items: center; gap: 2px; min-width: 0; flex: 1; overflow: hidden; }
.dg-sep { color: #3a3254; font-size: 18px; flex: none; }
.dg-crumb {
  background: transparent; border: 0; color: #7a6f99; font: inherit;
  font-size: 13.5px; font-weight: 650; cursor: pointer; padding: 4px 6px;
  border-radius: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 220px; transition: color .15s;
}
.dg-crumb:hover { color: #e2dff0; background: #211c30; }
.dg-crumb.active { color: #e2dff0; cursor: default; pointer-events: none; }
</style>
