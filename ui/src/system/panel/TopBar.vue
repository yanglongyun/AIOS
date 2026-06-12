<template>
  <header class="tb">
    <!-- 应用注册的左侧动作(如 chat 的汉堡=切历史面板) -->
    <button v-if="topLeftAction" class="tb-btn" :title="topLeftAction.title || ''" @click="topLeftAction.fn">
      <Menu v-if="topLeftAction.icon === 'menu'" :size="17" :stroke-width="1.8" />
      <ChevronLeft v-else-if="topLeftAction.icon === 'back'" :size="17" :stroke-width="2" />
      <Menu v-else :size="17" :stroke-width="1.8" />
    </button>

    <span class="tb-title">{{ topTitle }}</span>
    <div class="tb-gap"></div>

    <!-- 宫格:应用面板 -->
    <button class="tb-btn" :title="'应用'" @click.stop="toggle">
      <LayoutGrid :size="16" :stroke-width="1.8" />
    </button>

    <Teleport to="body">
      <div v-if="open" class="tb-mask" @click="open = false"></div>
      <transition name="tb-pop">
        <div v-if="open" class="tb-pop">
          <div class="tb-grid">
            <button
              v-for="app in apps"
              :key="app.id"
              type="button"
              class="tb-item"
              :class="{ on: app.id === currentAppId }"
              @click="pick(app.id)"
            >
              <span class="tb-ico"><component :is="app.icon || LayoutGrid" :size="21" :stroke-width="1.7" /></span>
              <span class="tb-name">{{ app.name }}</span>
            </button>
          </div>
        </div>
      </transition>
    </Teleport>
  </header>
</template>

<script setup>
// Global topbar — the single system-level surface (v6 design language).
// Left: app-registered action + current title. Right: the app panel grid.
import { ref } from 'vue';
import { Menu, ChevronLeft, LayoutGrid } from 'lucide-vue-next';
import { apps } from '../../apps.js';
import { currentAppId, openApp, topTitle, topLeftAction } from '../shell.js';

const open = ref(false);
function toggle() { open.value = !open.value; }
function pick(appId) {
  open.value = false;
  openApp(appId);
}
</script>

<style scoped>
.tb {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 10px 14px;
  padding-top: calc(10px + env(safe-area-inset-top, 0px));
  background: var(--bar-bg-top);
  border-bottom: 1px solid var(--bar-divider);
  position: relative;
  z-index: 40;
}
.tb-title { font-size: 14px; font-weight: 650; color: var(--color-ink); margin-left: 2px; }
.tb-gap { flex: 1; }
.tb-btn {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-faint);
  cursor: pointer;
  transition: background-color .12s, color .12s;
}
.tb-btn:hover { background: var(--color-bg-hi); color: var(--color-ink); }
</style>

<style>
/* Teleported — global, tb- prefixed */
.tb-mask { position: fixed; inset: 0; z-index: 35; }
.tb-pop {
  position: fixed;
  top: 50px;
  right: 12px;
  width: 312px;
  z-index: 36;
  padding: 10px;
  border: 1px solid var(--color-line);
  border-radius: 14px;
  background: var(--color-bg-elev);
  box-shadow: var(--shadow-lg);
}
.tb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.tb-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 13px 2px 11px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: background-color .12s;
}
.tb-item:hover { background: color-mix(in srgb, var(--color-ink) 5%, transparent); }
.tb-item.on { background: var(--color-blue-bg); }
.tb-ico {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--color-line);
  background: var(--color-card-sub);
  color: var(--color-muted);
}
.tb-item.on .tb-ico {
  background: var(--color-blue-bg);
  border-color: var(--color-blue-soft);
  color: var(--color-accent);
}
.tb-name { font-size: 12px; color: var(--color-muted); }
.tb-pop-enter-active, .tb-pop-leave-active { transition: opacity .14s, transform .14s; }
.tb-pop-enter-from, .tb-pop-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }
</style>
