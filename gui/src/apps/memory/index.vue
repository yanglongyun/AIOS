<template>
  <div class="app-frame">
    <AppTopbar title="记忆" :has-drawer="true">
      <template #actions>
        <button class="btn solid h-9" title="新建" @click="openCreate">
          <span class="msi xxs">add</span>
          <span class="max-md:hidden">新建</span>
        </button>
        <button class="icon-btn" title="刷新" @click="loadItems">
          <span class="msi sm">refresh</span>
        </button>
      </template>
    </AppTopbar>

    <div class="app-body">
      <Transition name="mask">
        <div v-if="view.appDrawerOpen" class="app-side-mask" @click="view.closeAppDrawer()" />
      </Transition>

      <aside class="app-side !bg-bg" :class="{ collapsed: !view.appDrawerOpen }">
        <div class="app-side-inner">
          <MemorySidebar :filters="filters" :current="tab" :counts="counts" @pick="pickFilter" />
        </div>
      </aside>

      <main class="memory-main">
        <section class="memory-shell">
          <div v-if="!showDetail" class="memory-head">
            <div>
              <div class="eyebrow">长期上下文</div>
              <h1>{{ activeTitle }}</h1>
            </div>
            <span class="total">{{ filteredItems.length }} 条</span>
          </div>

          <div v-if="error" class="memory-error">{{ error }}</div>

          <MemoryEmpty
            v-if="loading && !items.length"
            icon="progress_activity"
            message="加载中..." />

          <MemoryEmpty
            v-else-if="!filteredItems.length"
            :icon="tab === 'starred' ? 'star' : 'psychology'"
            :title="emptyText[0]"
            :message="emptyText[1]"
            action-label="新增记忆"
            @action="openCreate" />

          <div v-else-if="!showDetail" class="memory-list-view">
            <section class="memory-list">
              <MemoryRow
                v-for="item in filteredItems"
                :key="item.id"
                :item="item"
                :active="activeItem?.id === item.id"
                @open="openMemory(item)"
                @set-starred="(starred) => setStarred(item, starred)"
                @delete="deleteItem(item)" />
            </section>
          </div>

          <div v-else class="memory-detail-view">
            <button class="back-btn" @click="closeDetail">
              <span class="msi xxs">arrow_back</span>
              返回列表
            </button>
            <MemoryDetail
              :mode="detailMode"
              :title="editTitle"
              :description="editDescription"
              :content="editContent"
              :visibility="editVisibility"
              :saving="saving"
              :can-save="canSave"
              @update:title="editTitle = $event"
              @update:description="editDescription = $event"
              @update:content="editContent = $event"
              @update:visibility="editVisibility = $event"
              @edit="editActive"
              @cancel="closeDetail"
              @save="saveEdit" />
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useViewStore } from '@/stores/view.js';
import MemoryDetail from './components/MemoryDetail.vue';
import MemoryEmpty from './components/MemoryEmpty.vue';
import MemoryRow from './components/MemoryRow.vue';
import MemorySidebar from './components/MemorySidebar.vue';
import AppTopbar from '@/components/AppTopbar.vue';
import { useMemoryItems } from './composables/useMemoryItems.js';

const view = useViewStore();

const {
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
} = useMemoryItems();

const showDetail = computed(() => detailMode.value !== 'empty');

const pickFilter = (id) => {
  tab.value = id;
  if (window.innerWidth < 768) view.closeAppDrawer();
};
</script>

<style scoped>
.memory-main {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  background: var(--bg);
  color: var(--text);
  padding: 0 24px 24px;
}
.memory-shell {
  display: flex;
  width: min(1180px, 100%);
  margin: 0 auto;
  flex-direction: column;
  gap: 12px;
}
.memory-head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--bg);
  padding: 18px 0 12px;
}
.eyebrow {
  color: var(--text-2);
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.memory-head h1 {
  color: var(--text);
  font-size: 24px;
  font-weight: 650;
  margin-top: 2px;
}
.total {
  flex: none;
  border-radius: 999px;
  background: var(--bg-elev);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 650;
  padding: 5px 10px;
}
.memory-error {
  border-radius: 12px;
  border: 1px solid rgba(255, 63, 110, 0.25);
  background: rgba(255, 63, 110, 0.10);
  color: var(--bad);
  font-size: 13px;
  padding: 10px 14px;
}
.memory-list-view,
.memory-detail-view {
  width: min(900px, 100%);
}
.memory-list {
  min-width: 0;
}
.back-btn {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--bg-elev);
  color: var(--text-2);
  font-size: 13px;
  font-weight: 650;
  margin-bottom: 12px;
  padding: 0 14px;
}
.back-btn:hover {
  background: var(--bg-hover);
  color: var(--text);
}
@media (max-width: 768px) {
  .memory-main {
    padding: 0 12px 16px;
  }
  .memory-head {
    padding-top: 14px;
  }
  .memory-head h1 {
    font-size: 20px;
  }
  .memory-list-view,
  .memory-detail-view {
    width: 100%;
  }
}
</style>
