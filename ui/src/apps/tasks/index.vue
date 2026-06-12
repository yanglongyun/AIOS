<template>
  <div class="absolute inset-0 overflow-y-auto dot-grid">

    <!-- Task detail (secondary page) -->
    <TaskDetailView v-if="currentTaskId" :id="currentTaskId" />

    <!-- Task list -->
    <div v-else class="page">
      <div class="h-row">
        <h2>任务</h2>
      </div>

      <!-- Stats -->
      <div class="stats">
        <button
          v-for="s in statCards"
          :key="s.key"
          class="stat"
          :class="{ on: filter === s.key }"
          @click="filter = filter === s.key ? 'all' : s.key"
        >
          <span class="stat-dot" :style="{ background: s.color }"></span>
          <span class="stat-num">{{ s.count }}</span>
          <span class="stat-label">{{ s.label }}</span>
        </button>
      </div>

      <!-- Filter pills -->
      <div class="pills">
        <button
          v-for="p in pills"
          :key="p.key"
          class="pill"
          :class="{ on: filter === p.key }"
          @click="filter = p.key"
        >{{ p.label }}</button>
      </div>

      <div v-if="!filteredTasks.length" class="py-16 text-center text-[13px] text-faint">
        {{ tasks.length ? '没有符合条件的任务' : '暂无任务' }}
      </div>

      <template v-else>
        <template v-for="group in groupedTasks" :key="group.label">
          <div class="group-title">{{ group.label }}</div>
          <div
            v-for="item in group.items"
            :key="item.id"
            class="task"
            :class="{ running: isActive(item.status) }"
            @click="openTask(item)"
          >
            <span class="dot" :class="dotClass(item.status)"></span>
            <div class="min-w-0 flex-1">
              <b>{{ item.name || preview(item.prompt) || '未命名' }}</b>
              <div class="sub" :class="{ blue: isActive(item.status) }">
                {{ subline(item) }}
              </div>
            </div>
            <span class="time">{{ relTime(item.created_at) }}</span>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { topTitle, topLeftAction } from '@/system/shell.js';
import TaskDetailView from './views/Detail.vue';
import { fetchTasks, isActive, isDone, isFailed, parseTime, dayKey, relTime } from './lib/api.js';

const tasks = ref([]);
const currentTaskId = ref(null);
const filter = ref('all');

const dotClass = (status) => (isActive(status) ? 'run' : isDone(status) ? 'ok' : 'bad');

const statCards = computed(() => [
  { key: 'running', label: '运行中', color: 'var(--color-accent)', count: tasks.value.filter((t) => isActive(t.status)).length },
  { key: 'done', label: '已完成', color: 'var(--color-good, #2e9e5b)', count: tasks.value.filter((t) => isDone(t.status)).length },
  { key: 'failed', label: '失败', color: 'var(--color-bad, #d6493e)', count: tasks.value.filter((t) => isFailed(t.status)).length },
]);

const pills = [
  { key: 'all', label: '全部' },
  { key: 'running', label: '运行中' },
  { key: 'done', label: '已完成' },
  { key: 'failed', label: '失败' },
];

const filteredTasks = computed(() => {
  if (filter.value === 'running') return tasks.value.filter((t) => isActive(t.status));
  if (filter.value === 'done') return tasks.value.filter((t) => isDone(t.status));
  if (filter.value === 'failed') return tasks.value.filter((t) => isFailed(t.status));
  return tasks.value;
});

const groupedTasks = computed(() => {
  const buckets = { today: [], yesterday: [], earlier: [] };
  for (const t of filteredTasks.value) {
    const d = parseTime(t.created_at);
    buckets[d ? dayKey(d) : 'earlier'].push(t);
  }
  const labels = { today: '今天', yesterday: '昨天', earlier: '更早' };
  return ['today', 'yesterday', 'earlier']
    .filter((k) => buckets[k].length)
    .map((k) => ({ label: labels[k], items: buckets[k] }));
});

const preview = (text) => {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  return s.length > 60 ? s.slice(0, 60) + '…' : s;
};

const subline = (t) => {
  if (isActive(t.status)) return '正在执行…';
  if (isFailed(t.status)) return preview(t.error) || '执行失败';
  return preview(t.response) || '已完成';
};

const loadTasks = async () => {
  try {
    tasks.value = await fetchTasks();
  } catch {}
};

// Poll while there are active tasks
let timer = null;
const hasActive = computed(() => tasks.value.some((t) => isActive(t.status)));
watch(hasActive, (active) => {
  if (active && !timer) timer = setInterval(loadTasks, 3000);
  else if (!active && timer) { clearInterval(timer); timer = null; }
});

const openTask = (task) => { currentTaskId.value = task.id; };
const closeDetail = () => { currentTaskId.value = null; };

const resetTopBar = () => {
  topLeftAction.value = null;
  topTitle.value = '任务';
};

watch(currentTaskId, (id) => {
  if (id) {
    const cur = tasks.value.find((item) => item.id === id);
    topTitle.value = cur?.name || `#${id}`;
    topLeftAction.value = { icon: 'back', title: '返回', fn: closeDetail };
  } else {
    resetTopBar();
    loadTasks();
  }
});

onMounted(loadTasks);
onUnmounted(() => {
  resetTopBar();
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.page {
  max-width: 860px;
  margin: 0 auto;
  padding: 26px 24px 50px;
}
.h-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.h-row h2 {
  font-size: 17px;
  font-weight: 700;
  flex: 1;
  color: var(--color-ink);
}

/* Stats */
.stats {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.stat {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 13px 14px 11px 26px;
  background: var(--color-bg-elev);
  border: 1px solid var(--color-line);
  border-radius: 12px;
  box-shadow: var(--shadow);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.12s;
}
.stat:hover { border-color: #dededf; }
.stat.on { border-color: var(--color-accent); }
.stat-dot {
  position: absolute;
  top: 14px;
  left: 13px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.stat-num {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-ink);
  font-variant-numeric: tabular-nums;
}
.stat-label {
  font-size: 11px;
  color: var(--color-muted);
}

/* Filter pills */
.pills {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.pill {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-line);
  font-size: 12.5px;
  color: var(--color-muted);
  background: var(--color-bg-elev);
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.pill:hover { background: #f7f7f8; }
.pill.on {
  background: var(--color-blue-bg, #eef4fe);
  border-color: transparent;
  color: var(--color-accent);
  font-weight: 600;
}

/* Group titles */
.group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-muted);
  margin: 18px 2px 8px;
}
.group-title:first-of-type { margin-top: 4px; }

/* Task rows */
.task {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 13px 16px;
  background: var(--color-bg-elev);
  border: 1px solid var(--color-line);
  border-radius: 12px;
  box-shadow: var(--shadow);
  margin-bottom: 10px;
  cursor: pointer;
  transition: border-color 0.12s;
}
.task:hover { border-color: #dededf; }
.task.running { border-left: 2px solid var(--color-accent); }
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}
.dot.run { background: var(--color-accent); animation: tk-pulse 1.4s infinite; }
.dot.ok { background: var(--color-good); }
.dot.bad { background: var(--color-bad); }
@keyframes tk-pulse { 50% { opacity: 0.35; } }
.task b {
  font-size: 13.5px;
  font-weight: 600;
  display: block;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task .sub {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task .sub.blue { color: var(--color-accent); }
.task .time {
  flex-shrink: 0;
  font-size: 11.5px;
  color: var(--color-faint);
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}
</style>
