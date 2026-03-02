import { computed, ref } from 'vue';
import { connect, on } from '../ws.js';

export const useTopPanels = () => {
  const activePanel = ref(null);
  const asks = ref([]);
  const notifications = ref([]);
  const lastSeenAskId = ref(Number(localStorage.getItem('asks.lastSeenId') || 0));

  const askCount = computed(() => asks.value.filter(r => Number(r.id || 0) > lastSeenAskId.value).length);
  const hasPending = computed(() => asks.value.some(r => r.status === 'pending'));
  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

  const fetchData = async () => {
    try {
      const [reqRes, notifRes] = await Promise.all([
        fetch('/api/ask?limit=20'),
        fetch('/api/notifications?limit=20')
      ]);
      asks.value = await reqRes.json();
      notifications.value = await notifRes.json();
    } catch {}
  };

  const markAsksRead = () => {
    let max = 0;
    for (const r of asks.value) {
      const id = Number(r.id || 0);
      if (id > max) max = id;
    }
    if (max <= 0) return;
    lastSeenAskId.value = max;
    localStorage.setItem('asks.lastSeenId', String(max));
  };

  const togglePanel = (name) => {
    const opening = activePanel.value !== name;
    activePanel.value = opening ? name : null;
    if (opening && name === 'asks') markAsksRead();
  };

  const unsubs = [];
  const start = () => {
    connect();
    fetchData();
    unsubs.push(on('open', fetchData));
    unsubs.push(on('asks_changed', fetchData));
    unsubs.push(on('notifications_changed', fetchData));
  };

  const stop = () => {
    while (unsubs.length) {
      const off = unsubs.pop();
      if (typeof off === 'function') off();
    }
  };

  return {
    activePanel,
    asks,
    notifications,
    askCount,
    hasPending,
    unreadCount,
    togglePanel,
    start,
    stop
  };
};

