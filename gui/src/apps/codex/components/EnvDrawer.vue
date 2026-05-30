<script setup>
import { onMounted, onUnmounted, watch } from "vue";
import InspectPanel from "./InspectPanel.vue";
import { envPanels } from "../constants.js";

const props = defineProps({
  open: { type: Boolean, default: false },
  panel: { type: String, default: "account" },
  data: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["close", "select"]);

function onKey(event) {
  if (event.key === "Escape" && props.open) emit("close");
}

onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));

watch(() => props.open, (v) => {
  document.body.style.overflow = v ? "hidden" : "";
});
</script>

<template>
  <Transition name="env-mask">
    <div v-if="open" class="env-mask" @click="$emit('close')" />
  </Transition>
  <Transition name="env-panel">
    <div v-if="open" class="env-drawer" role="dialog" aria-modal="true">
      <header>
        <div class="head-title">
          <span class="msi">tune</span>
          <h2>环境</h2>
        </div>
        <button class="close-btn" title="关闭" @click="$emit('close')">
          <span class="msi">close</span>
        </button>
      </header>

      <div class="body">
        <nav>
          <button
            v-for="item in envPanels"
            :key="item.id"
            class="nav-item"
            :class="{ active: item.id === panel }"
            @click="$emit('select', item.id)">
            <span class="msi">{{ item.icon }}</span>
            <span>{{ item.name }}</span>
          </button>
        </nav>
        <section class="content">
          <InspectPanel
            :panel="panel"
            :data="data[panel]"
            :loading="loading"
            :error="error" />
        </section>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.env-mask {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: rgba(20, 25, 30, 0.42);
}
.env-drawer {
  position: absolute;
  top: 0; right: 0; bottom: 0;
  z-index: 51;
  width: min(880px, 96vw);
  background: var(--bg);
  box-shadow: var(--shadow-3);
  display: flex; flex-direction: column;
  overflow: hidden;
}

header {
  flex: none;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px 12px 18px;
  border-bottom: 1px solid var(--line-soft);
}
.head-title {
  display: flex; align-items: center; gap: 10px;
}
.head-title .msi { color: var(--accent); font-size: 22px; }
.head-title h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
  color: var(--text);
  letter-spacing: -0.005em;
}
.close-btn {
  width: 34px; height: 34px;
  display: grid; place-items: center;
  border: 0; border-radius: 8px;
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  transition: background .12s, color .12s;
}
.close-btn:hover { background: var(--bg-elev); color: var(--text); }
.close-btn .msi { font-size: 20px; }

.body {
  flex: 1; min-height: 0;
  display: flex;
}
nav {
  flex: none;
  width: 180px;
  border-right: 1px solid var(--line-soft);
  padding: 8px;
  display: flex; flex-direction: column; gap: 1px;
  overflow-y: auto;
  background: var(--bg);
}
.nav-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%;
  border: 0; border-radius: 8px;
  background: transparent;
  color: var(--text);
  padding: 8px 11px;
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background .12s, color .12s;
}
.nav-item:hover { background: var(--bg-elev); }
.nav-item.active {
  background: var(--accent-soft);
  color: var(--accent-fg);
  font-weight: 600;
}
.nav-item .msi {
  font-size: 18px;
  color: var(--text-3);
}
.nav-item.active .msi { color: var(--accent); }

.content {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column;
  overflow: hidden;
}

.env-mask-enter-from, .env-mask-leave-to { opacity: 0; }
.env-mask-enter-active, .env-mask-leave-active { transition: opacity 0.18s ease; }
.env-panel-enter-from, .env-panel-leave-to { transform: translateX(100%); }
.env-panel-enter-active, .env-panel-leave-active { transition: transform 0.22s cubic-bezier(.32,.72,.36,1); }

@media (max-width: 760px) {
  .env-drawer { width: 100%; }
  nav { width: 56px; padding: 6px; }
  .nav-item { justify-content: center; padding: 10px 0; }
  .nav-item span:last-child { display: none; }
  .nav-item .msi { font-size: 20px; }
}
</style>
