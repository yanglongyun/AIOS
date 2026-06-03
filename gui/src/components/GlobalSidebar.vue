<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apps } from '@/apps.js';
import { useViewStore } from '@/stores/view.js';

const route = useRoute();
const router = useRouter();
const view = useViewStore();

const activeId = computed(() => String(route.params.id || 'chat'));
const navApps = computed(() => apps); // 平铺,不分组

function go(id) {
  if (activeId.value !== id) router.push(`/app/${id}`);
  if (window.innerWidth <= 768) view.closeGlobalNav();
}
</script>

<template>
  <!-- 移动端抽屉遮罩(由各 app 顶栏的 apps 按钮唤出) -->
  <Transition name="fade">
    <div v-if="view.globalNavOpen" class="mobile-mask" @click="view.closeGlobalNav()"></div>
  </Transition>

  <aside class="sb" :class="{ collapsed: !view.globalNavOpen }">
    <!-- 顶部:品牌 / 折叠 -->
    <header class="sb-head">
      <span v-if="view.globalNavOpen" class="brand">AIOS</span>
      <button class="ghost-btn" type="button" :title="view.globalNavOpen ? '收起' : '展开'"
              @click="view.toggleGlobalNav()">
        <span class="msi sm">{{ view.globalNavOpen ? 'left_panel_close' : 'left_panel_open' }}</span>
      </button>
    </header>

    <!-- 应用列表(平铺) -->
    <nav class="sb-list">
      <button
        v-for="app in navApps"
        :key="app.id"
        class="item"
        :class="{ active: activeId === app.id }"
        type="button"
        :title="app.name"
        :style="{ '--c': app.color }"
        @click="go(app.id)">
        <span class="item-ic">
          <span class="msi sm">{{ app.icon }}</span>
        </span>
        <span v-if="view.globalNavOpen" class="item-tx">{{ app.name }}</span>
      </button>
    </nav>
  </aside>
</template>

<style scoped>
/* ===================== 容器 ===================== */
.sb {
  flex: none;
  z-index: 70;
  display: flex;
  flex-direction: column;
  width: 248px;
  height: 100dvh;
  padding: 14px 12px;
  background:
    linear-gradient(180deg, rgba(7, 24, 39, 0.92) 0%, rgba(3, 9, 20, 0.96) 100%);
  border-right: 1px solid var(--line-soft);
  box-shadow:
    inset -1px 0 0 rgba(0, 215, 255, 0.07),
    1px 0 24px rgba(0, 0, 0, 0.45);
  transition: width 0.18s ease;
}
.sb.collapsed {
  width: 64px;
  padding-left: 9px;
  padding-right: 9px;
}

/* ===================== 顶部 ===================== */
.sb-head {
  flex: none;
  height: 46px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 6px;
}
.collapsed .sb-head { justify-content: center; padding: 0; }
.brand {
  flex: 1;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.04em;
  background: linear-gradient(120deg, #eafaff 0%, var(--accent-hi) 55%, var(--accent) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 18px rgba(0, 215, 255, 0.35);
}

/* ===================== 列表 ===================== */
.sb-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0 4px;
}
.sb-list::-webkit-scrollbar { display: none; }

.item {
  position: relative;
  width: 100%;
  height: 46px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 11px;
  border: 1px solid transparent;
  border-radius: 13px;
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.collapsed .item { justify-content: center; padding: 0; }

.item:hover {
  background: rgba(11, 33, 56, 0.7);
  border-color: var(--line);
  color: var(--accent-hi);
}

/* 选中:电光蓝高亮 + 霓虹辉光 */
.item.active {
  background: linear-gradient(90deg, rgba(0, 215, 255, 0.16) 0%, rgba(0, 215, 255, 0.03) 100%);
  border-color: rgba(0, 215, 255, 0.45);
  color: #eafaff;
  box-shadow:
    0 0 18px rgba(0, 215, 255, 0.22),
    inset 0 0 14px rgba(0, 215, 255, 0.07);
}
/* 左侧霓虹竖条 */
.item.active::before {
  content: "";
  position: absolute;
  left: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 22px;
  border-radius: 3px;
  background: var(--accent);
  box-shadow: 0 0 10px var(--accent), 0 0 4px var(--accent-hi);
}
.collapsed .item.active::before { left: -3px; height: 26px; }

.item-ic {
  flex: none;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  color: var(--c, var(--accent));
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--c, var(--accent)) 30%, transparent));
  opacity: 0.85;
  transition: opacity 0.15s ease, filter 0.15s ease;
}
.item:hover .item-ic { opacity: 1; }
.item.active .item-ic {
  opacity: 1;
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--c, var(--accent)) 70%, transparent));
}

.item-tx {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: 0.01em;
}

/* ===================== 通用 ghost 按钮 ===================== */
.ghost-btn {
  width: 38px;
  height: 38px;
  flex: none;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.ghost-btn:hover {
  background: rgba(11, 33, 56, 0.7);
  border-color: var(--line);
  color: var(--accent-hi);
  box-shadow: 0 0 12px rgba(0, 215, 255, 0.18);
}

/* ===================== 移动端 ===================== */
.mobile-mask { display: none; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  /* 仅在展开(悬浮)时盖一层遮罩 */
  .mobile-mask {
    position: fixed;
    inset: 0;
    z-index: 68;
    display: block;
    background: rgba(1, 5, 12, 0.6);
    backdrop-filter: blur(2px);
  }
  /* 收起态:常驻窄图标栏,留在文档流中(不消失) */
  .sb.collapsed {
    position: relative;
    width: 60px;
    padding-left: 8px;
    padding-right: 8px;
    transform: none;
  }
  /* 展开态:悬浮覆盖在内容之上,不挤压布局 */
  .sb:not(.collapsed) {
    position: fixed;
    left: 0; top: 0; bottom: 0;
    z-index: 75;
    width: 250px;
    transition: width 0.18s ease;
    box-shadow: 30px 0 70px rgba(0, 0, 0, 0.6), inset -1px 0 0 rgba(0, 215, 255, 0.12);
  }
}
</style>
