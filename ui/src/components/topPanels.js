import { computed, ref } from 'vue';
import { connect, on } from '../ws.js';

export const useTopPanels = () => {
  const activePanel = ref(null);
  const tasks = ref([]);
  const lastSeenTaskId = ref(Number(localStorage.getItem('tasks.lastSeenId') || 0));

  const taskRows = computed(() => (Array.isArray(tasks.value) ? tasks.value : []));
  const taskCount = computed(() => taskRows.value.filter(r => Number(r.id || 0) > lastSeenTaskId.value).length);
  const hasPending = computed(() => taskRows.value.some(r => r.status === 'pending'));

  const fetchData = async () => {
    try {
      const reqRes = await fetch('/aios/api/task?limit=20');
      const taskData = await reqRes.json();
      tasks.value = Array.isArray(taskData) ? taskData : [];
    } catch {}
  };

  const markTasksRead = () => {
    let max = 0;
    for (const r of taskRows.value) {
      const id = Number(r.id || 0);
      if (id > max) max = id;
    }
    if (max <= 0) return;
    lastSeenTaskId.value = max;
    localStorage.setItem('tasks.lastSeenId', String(max));
  };

  const togglePanel = (name) => {
    const opening = activePanel.value !== name;
    activePanel.value = opening ? name : null;
    if (opening && name === 'tasks') markTasksRead();
  };

  const unsubs = [];
  const start = () => {
    connect();
    fetchData();
    unsubs.push(on('open', fetchData));
    unsubs.push(on('tasks_changed', fetchData));
  };

  const stop = () => {
    while (unsubs.length) {
      const off = unsubs.pop();
      if (typeof off === 'function') off();
    }
  };

  return {
    activePanel,
    tasks,
    taskCount,
    hasPending,
    togglePanel,
    markTasksRead,
    start,
    stop
  };
};
