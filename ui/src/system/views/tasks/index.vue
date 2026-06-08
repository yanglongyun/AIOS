<template>
  <div class="absolute inset-0 flex flex-col bg-[linear-gradient(180deg,#f0e8d5_0%,#e8dfca_100%)]">

    <!-- Task detail (secondary page) -->
    <TaskDetailView v-if="currentTaskId" :id="currentTaskId" />

    <!-- Task list -->
    <template v-else>
      <div class="flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:none]">

        <div v-if="!allItems.length" class="py-16 text-center text-[13px] text-[#a09080]">暂无任务</div>
        <div v-else class="flex flex-col gap-2">
          <div
            v-for="item in allItems"
            :key="item._key"
            class="rounded-[14px] px-3.5 py-3 active:opacity-80"
            :style="listCardStyle"
            @click="item._type === 'task' && openTask(item)"
          >
            <div class="flex items-start gap-2.5">
              <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                <span v-if="isActive(item.status)" class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#c8a060]"></span>
                <span v-else-if="isDone(item.status)" class="text-[14px] text-[#6a9a58]">✓</span>
                <span v-else class="text-[14px] text-[#c06050]">✗</span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-[13px] font-semibold text-[#3a2415]">{{ item.name || payloadPreview(item) || '未命名' }}</div>
                <div class="mt-1 flex items-center gap-2">
                  <span class="rounded-[5px] bg-[rgba(120,90,40,0.08)] px-1.5 py-0.5 text-[10px] text-[#7a6a58]">task</span>
                  <span class="text-[10px] text-[#a09080]">{{ item.created_at || '' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue';
import TaskDetailView from './Detail.vue';

const setPageNav = inject('pageNav');
const tasks = ref([]);
const currentTaskId = ref(null);

const allItems = computed(() => {
  return tasks.value.map((t) => ({ ...t, _type: 'task', _key: `t-${t.id}` }));
});

const isActive = (status) => status === 'pending' || status === 'running';
const isDone = (status) => status === 'done' || status === 'completed';

function payloadPreview(t) {
  return String(t.prompt || '').slice(0, 60);
}

const loadTasks = async () => {
  const r = await fetch('/api/tasks?limit=200');
  const data = await r.json().catch(() => ({}));
  tasks.value = data.tasks || [];
};
const loadAll = async () => { try { await loadTasks(); } catch {} };

const openTask = (task) => {
  currentTaskId.value = task.id;
  setPageNav(task.name || `#${task.id}`, () => { currentTaskId.value = null; setPageNav(null, null); });
};

const listCardStyle    = { background: 'linear-gradient(160deg,#faf5e8 0%,#f2ebd8 100%)', boxShadow: '0 2px 8px rgba(90,60,20,0.1),inset 0 1px 0 rgba(255,255,255,0.8)', border: '1px solid rgba(180,150,80,0.18)' };

onMounted(loadAll);
</script>
