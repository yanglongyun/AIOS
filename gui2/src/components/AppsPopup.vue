<script setup>
import { onBeforeUnmount, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useViewStore } from '@/stores/view.js';
import { apps } from '@/apps.js';

const view = useViewStore();
const router = useRouter();
const route = useRoute();

function go(id) {
  view.closeApps();
  const path = `/app/${id}`;
  if (route.path !== path) router.push(path);
}
function isActive(id) { return route.path === `/app/${id}`; }

function onDocClick(e) {
  if (!view.appsOpen) return;
  // 让 TopBar 的 ⚏ 按钮自己 toggle,不被 doc click 立即关上
  if (e.target.closest('[title="所有应用"]')) return;
  if (e.target.closest('.apps-popup')) return;
  view.closeApps();
}
function onEsc(e) { if (e.key === 'Escape') view.closeApps(); }
onMounted(() => {
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onEsc);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick);
  document.removeEventListener('keydown', onEsc);
});
</script>

<template>
  <Transition name="apps-fade">
    <div v-if="view.appsOpen" class="apps-popup">
      <div class="grid">
        <button v-for="app in apps" :key="app.id"
          class="tile"
          :class="{ active: isActive(app.id) }"
          @click="go(app.id)">
          <span class="ic" :style="{ background: app.color }">
            <span class="msi" style="color:#fff">{{ app.icon }}</span>
          </span>
          <span class="name">{{ app.name }}</span>
        </button>
      </div>
      <div class="foot">
        <a href="#">关于 AIOS</a>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.apps-popup {
  position: fixed;
  top: calc(var(--topbar-h) - 4px); right: 12px;
  width: 320px; max-width: calc(100vw - 24px);
  max-height: calc(100vh - 80px);
  background: var(--bg);
  border-radius: 8px;
  box-shadow: var(--shadow-3);
  z-index: 60;
  display: flex; flex-direction: column;
  overflow: hidden;
  transform-origin: top right;
}
.apps-fade-enter-active { animation: pop-in 0.16s cubic-bezier(.2,.7,.2,1); }
.apps-fade-leave-active { animation: pop-in 0.12s reverse; }
@keyframes pop-in {
  from { opacity: 0; transform: scale(.92) translateY(-6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.grid {
  flex: 1; min-height: 0;
  overflow-y: auto;
  padding: 8px 4px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
.tile {
  display: flex; flex-direction: column; align-items: center;
  gap: 6px;
  padding: 14px 4px;
  border: 0; background: transparent;
  border-radius: 8px;
  color: var(--text);
  text-align: center;
  transition: background .15s;
}
.tile:hover { background: var(--bg-hover); }
.tile.active { background: var(--accent-soft); }
.tile .ic {
  width: 40px; height: 40px;
  display: grid; place-items: center;
  border-radius: 8px;
}
.tile .ic .msi { font-size: 22px; }
.tile .name { font-size: 12px; line-height: 1.2; }

.foot {
  flex: none;
  border-top: 1px solid var(--line-soft);
  padding: 8px 12px;
  text-align: center;
}
.foot a {
  color: var(--accent);
  font-size: 13px; font-weight: 500;
  padding: 6px 12px;
  border-radius: 16px;
  transition: background .15s;
}
.foot a:hover { background: var(--accent-soft); }

@media (max-width: 720px) {
  .apps-popup {
    top: 50px; left: 8px; right: 8px; width: auto;
  }
}
</style>
