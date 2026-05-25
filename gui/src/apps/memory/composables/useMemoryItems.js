import { computed, onMounted, ref } from 'vue';
import * as api from '@/utils/api.js';

export function useMemoryItems() {
  const loading = ref(false);
  const error = ref('');
  const items = ref([]);
  const tab = ref('all');
  const detailMode = ref('empty');
  const activeItem = ref(null);
  const editId = ref(null);
  const editTitle = ref('');
  const editDescription = ref('');
  const editContent = ref('');
  const editVisibility = ref('full');
  const saving = ref(false);

  const full = computed(() => items.value.filter((item) => item.visibility === 'full'));
  const starred = computed(() => items.value.filter((item) => item.starred));
  const saved = computed(() => items.value.filter((item) => item.visibility !== 'full'));
  const canSave = computed(() => Boolean(editTitle.value.trim() && editContent.value.trim()));

  const filters = [
    { id: 'all', name: '全部', icon: 'inbox' },
    { id: 'required', name: '必读', icon: 'visibility' },
    { id: 'starred', name: '星标', icon: 'star' },
    { id: 'saved', name: '已存', icon: 'bookmark' },
  ];

  const counts = computed(() => ({
    all: items.value.length,
    required: full.value.length,
    starred: starred.value.length,
    saved: saved.value.length,
  }));

  const activeTitle = computed(() => {
    const current = filters.find((item) => item.id === tab.value);
    return current?.name || '全部';
  });

  const filteredItems = computed(() => {
    if (tab.value === 'required') return full.value;
    if (tab.value === 'starred') return starred.value;
    if (tab.value === 'saved') return saved.value;
    return items.value;
  });

  const emptyText = computed(() => [
    tab.value === 'all' ? '还没有记忆' : `${activeTitle.value}没有内容`,
    tab.value === 'all' ? '把重要偏好、长期事实和稳定背景放在这里。' : '',
  ]);

  const setError = (err, prefix = '操作失败') => {
    error.value = `${prefix}: ${err?.body?.message || err?.message || err}`;
  };

  const loadItems = async () => {
    loading.value = true;
    try {
      const data = await api.get('/api/memory/list');
      items.value = Array.isArray(data.items) ? data.items : [];
      error.value = '';
    } catch (err) {
      setError(err, '加载失败');
    } finally {
      loading.value = false;
    }
  };

  const setVisibility = async (item, visibility) => {
    if (item.visibility === visibility) return;
    try {
      const res = await api.post('/api/memory/update', { id: item.id, visibility });
      Object.assign(item, res.item || { visibility });
      if (activeItem.value?.id === item.id) Object.assign(activeItem.value, res.item || { visibility });
    } catch (err) {
      setError(err);
    }
  };

  const setStarred = async (item, starredValue) => {
    if (item.starred === starredValue) return;
    try {
      const res = await api.post('/api/memory/update', { id: item.id, starred: starredValue });
      Object.assign(item, res.item || { starred: starredValue });
      if (activeItem.value?.id === item.id) Object.assign(activeItem.value, res.item || { starred: starredValue });
    } catch (err) {
      setError(err);
    }
  };

  const deleteItem = async (item) => {
    if (!confirm(`删除「${item.title}」?此操作不可撤销`)) return;
    try {
      await api.post('/api/memory/delete', { id: item.id });
      items.value = items.value.filter((current) => current.id !== item.id);
      if (activeItem.value?.id === item.id) closeDetail();
    } catch (err) {
      setError(err, '删除失败');
    }
  };

  const setDraft = (item = null) => {
    editId.value = item?.id || null;
    editTitle.value = item?.title || '';
    editDescription.value = item?.description || '';
    editContent.value = item?.content || '';
    editVisibility.value = item?.visibility || 'full';
  };

  const openMemory = async (item) => {
    activeItem.value = item;
    setDraft(item);
    if (item) {
      try {
        const data = await api.get('/api/memory/get', { query: { id: item.id } });
        activeItem.value = data.item || item;
        setDraft(activeItem.value);
      } catch (err) {
        setError(err, '读取失败');
      }
    }
    detailMode.value = 'view';
  };

  const openCreate = () => {
    activeItem.value = null;
    setDraft(null);
    detailMode.value = 'create';
  };

  const editActive = () => {
    if (!activeItem.value) return;
    setDraft(activeItem.value);
    detailMode.value = 'edit';
  };

  const closeDetail = () => {
    activeItem.value = null;
    setDraft(null);
    detailMode.value = 'empty';
  };

  const saveEdit = async () => {
    if (!canSave.value || saving.value) return;
    saving.value = true;
    try {
      const payload = {
        title: editTitle.value.trim(),
        description: editDescription.value.trim(),
        content: editContent.value.trim(),
        visibility: editVisibility.value,
      };
      const res = editId.value
        ? await api.post('/api/memory/update', { id: editId.value, ...payload })
        : await api.post('/api/memory/create', payload);
      await loadItems();
      activeItem.value = res.item || null;
      setDraft(activeItem.value);
      detailMode.value = activeItem.value ? 'view' : 'empty';
    } catch (err) {
      setError(err, '保存失败');
    } finally {
      saving.value = false;
    }
  };

  onMounted(loadItems);

  return {
    loading,
    error,
    items,
    tab,
    filters,
    counts,
    activeTitle,
    filteredItems,
    emptyText,
    detailMode,
    activeItem,
    editId,
    editTitle,
    editDescription,
    editContent,
    editVisibility,
    saving,
    canSave,
    loadItems,
    setVisibility,
    setStarred,
    deleteItem,
    openMemory,
    openCreate,
    editActive,
    closeDetail,
    saveEdit,
  };
}
