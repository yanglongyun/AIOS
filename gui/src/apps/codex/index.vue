<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import * as codexApi from "./api.js";
import Messages from "./components/Messages.vue";
import Composer from "./components/Composer.vue";
import InspectPanel from "./components/InspectPanel.vue";
import CodexNav from "./components/CodexNav.vue";
import RunOptions from "./components/RunOptions.vue";
import HistoryPanel from "./components/HistoryPanel.vue";
import CodexTopbar from "./components/CodexTopbar.vue";
import { modes, tabs } from "./constants.js";

const drawerOpen = ref(!(typeof window !== "undefined" && window.innerWidth <= 720));
const threads = ref([]);
const activeThread = ref(null);
const messages = ref([]);
const input = ref("");
const status = ref(null);
const loading = ref(false);
const inspectLoading = ref(false);
const running = ref(false);
const error = ref("");
const inspectError = ref("");
const activeTab = ref("new");
const inspectData = ref({});
const options = ref({
  mode: "workspace",
  cwd: "/Users/woodchange/Desktop/AIOS",
});

const connected = computed(() => Boolean(status.value?.connected && status.value?.initialized));
const activeTitle = computed(() => {
  if (activeTab.value === "new") return "新会话";
  if (activeTab.value === "history") return "会话历史";
  if (activeTab.value === "chat") return activeThread.value?.title || activeThread.value?.name || activeThread.value?.id || "当前会话";
  return tabs.find((item) => item.id === activeTab.value)?.name || "Codex";
});
const activeMode = computed(() => modes.find((item) => item.id === options.value.mode) || modes[1]);
const currentInspect = computed(() => inspectData.value[activeTab.value] || null);
const inspectTabs = new Set(["account", "models", "config", "permissions", "skills", "mcp", "plugins", "hooks", "apps"]);

function isMobile() {
  return typeof window !== "undefined" && window.innerWidth <= 720;
}

function closeDrawerOnMobile() {
  if (isMobile()) drawerOpen.value = false;
}

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}

function key(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addMessage(role, text) {
  messages.value.push({ key: key(role), role, text: String(text || "") });
  nextTick(() => {
    const el = document.querySelector(".codex-main .messages");
    if (el) el.scrollTop = el.scrollHeight;
  });
}

function normalizeThreads(result) {
  const root = result?.result || result;
  const list = Array.isArray(root?.threads) ? root.threads
    : Array.isArray(root?.items) ? root.items
      : Array.isArray(root) ? root
        : [];
  return list.map((item) => ({
    ...item,
    id: String(item.id || item.threadId || item.thread_id || ""),
  })).filter((item) => item.id);
}

function messageText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((part) => typeof part === "string" ? part : (part?.text || part?.content || "")).filter(Boolean).join("\n");
  }
  return "";
}

function collectMessages(node, out = [], seen = new Set()) {
  if (!node || out.length > 120) return out;
  if (typeof node !== "object") return out;
  if (seen.has(node)) return out;
  seen.add(node);

  const role = typeof node.role === "string" ? node.role : "";
  const text = messageText(node.content || node.text || node.message);
  if ((role === "user" || role === "assistant") && text) {
    out.push({ key: key(role), role, text });
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") collectMessages(value, out, seen);
  }
  return out;
}

async function refreshStatus() {
  const res = await codexApi.status();
  status.value = res.status || res;
}

async function startBridge() {
  error.value = "";
  try {
    const res = await codexApi.start();
    status.value = res.status || res;
    await loadThreads();
  } catch (err) {
    error.value = err?.body?.message || err.message || String(err);
  }
}

async function loadThreads() {
  loading.value = true;
  error.value = "";
  try {
    const res = await codexApi.listThreads({ limit: 80 });
    threads.value = normalizeThreads(res);
  } catch (err) {
    error.value = err?.body?.message || err.message || String(err);
  } finally {
    loading.value = false;
    await refreshStatus().catch(() => {});
  }
}

async function loadInspect(panel = activeTab.value) {
  if (!inspectTabs.has(panel)) return;
  inspectLoading.value = true;
  inspectError.value = "";
  try {
    const res = await codexApi.inspect({ panel, cwd: options.value.cwd });
    inspectData.value = { ...inspectData.value, [panel]: res };
  } catch (err) {
    inspectError.value = err?.body?.message || err.message || String(err);
  } finally {
    inspectLoading.value = false;
    await refreshStatus().catch(() => {});
  }
}

async function newThread() {
  activeThread.value = null;
  messages.value = [];
  input.value = "";
  error.value = "";
  activeTab.value = "new";
}

function pickTab(tab) {
  if (tab === "new") newThread();
  else activeTab.value = tab;
  closeDrawerOnMobile();
}

async function pickThread(thread) {
  activeThread.value = thread;
  messages.value = [];
  error.value = "";
  activeTab.value = "chat";
  closeDrawerOnMobile();
  try {
    const res = await codexApi.readThread(thread.id);
    messages.value = collectMessages(res.result || res);
  } catch (err) {
    error.value = err?.body?.message || err.message || String(err);
  }
}

async function ensureThread() {
  if (activeThread.value?.id) return activeThread.value;
  const res = await codexApi.createThread({
    cwd: options.value.cwd,
    sandbox: activeMode.value.sandbox,
    approvalPolicy: activeMode.value.approvalPolicy,
  });
  activeThread.value = res.thread || res;
  if (activeThread.value?.id) {
    threads.value = [activeThread.value, ...threads.value.filter((item) => item.id !== activeThread.value.id)];
  }
  return activeThread.value;
}

async function sendPrompt() {
  const prompt = input.value.trim();
  if (!prompt || running.value) return;
  input.value = "";
  error.value = "";
  addMessage("user", prompt);
  running.value = true;
  try {
    const thread = await ensureThread();
    activeTab.value = "chat";
    const res = await codexApi.runTurn({
      threadId: thread.id,
      prompt,
      cwd: options.value.cwd,
      sandbox: activeMode.value.sandbox,
      approvalPolicy: activeMode.value.approvalPolicy,
    });
    const finalText = String(res?.result?.finalText || "").trim();
    const last = messages.value[messages.value.length - 1];
    if (last?.role === "assistant" && last.streaming) {
      last.streaming = false;
      if (!last.text && finalText) last.text = finalText;
    } else if (finalText) {
      addMessage("assistant", finalText);
    }
    await loadThreads();
  } catch (err) {
    error.value = err?.body?.message || err.message || String(err);
  } finally {
    running.value = false;
  }
}

onMounted(async () => {
  await refreshStatus().catch(() => {});
  if (connected.value) await loadThreads();
});
watch(activeTab, (tab) => {
  if (tab === "history") loadThreads();
  loadInspect(tab);
});
</script>

<template>
  <div class="app-frame codex-app">
    <CodexTopbar
      :title="activeTitle"
      :connected="connected"
      :drawer-open="drawerOpen"
      @toggle-drawer="toggleDrawer" />

    <div v-if="error" class="error">{{ error }}</div>

    <div class="app-body">
      <Transition name="mask">
        <div v-if="drawerOpen" class="codex-side-mask" @click="drawerOpen = false" />
      </Transition>

      <aside class="codex-side" :class="{ collapsed: !drawerOpen }">
        <div class="codex-side-inner">
          <CodexNav :items="tabs" :current="activeTab" @pick="pickTab" />
        </div>
      </aside>

      <section class="codex-content">
        <HistoryPanel
          v-if="activeTab === 'history'"
          :threads="threads"
          :active-id="activeThread?.id || ''"
          :connected="connected"
          :loading="loading"
          @new="pickTab('new')"
          @pick="pickThread"
          @refresh="loadThreads"
          @start="startBridge" />

        <main v-else-if="activeTab === 'new' || activeTab === 'chat'" class="codex-main">
          <RunOptions
            :modes="modes"
            :mode="options.mode"
            :cwd="options.cwd"
            :disabled="running"
            @update:mode="options.mode = $event"
            @update:cwd="options.cwd = $event" />
          <Messages
            :messages="messages"
            :running="running"
            :empty-title="activeTab === 'new' ? '新会话' : '当前会话'"
            :empty-text="activeTab === 'new' ? '选择工作区和模式，然后输入指令。' : '从会话历史选择一个线程，或打开新会话。'" />
          <Composer v-model="input" :disabled="running || !connected" @send="sendPrompt" />
        </main>

        <InspectPanel
          v-else
          :panel="activeTab"
          :data="currentInspect"
          :loading="inspectLoading"
          :error="inspectError" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.codex-app { background: #f3f6f8; color: #202124; }
.codex-content { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.codex-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.codex-side {
  flex: none;
  width: 280px;
  background: var(--bg);
  border-right: 1px solid var(--line-soft);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.18s cubic-bezier(.4,0,.2,1);
}
.codex-side.collapsed {
  width: 0;
  border-right: 0;
}
.codex-side-inner {
  width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.codex-side-mask {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.4);
}
.error {
  flex: none; margin: 10px 14px 0; border-radius: 8px; padding: 9px 12px;
  background: #fde8e6; color: #b3261e; font-size: 13px;
}
@media (min-width: 721px) {
  .codex-side-mask { display: none; }
}
@media (max-width: 720px) {
  .codex-side {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 41;
    transform: translateX(0);
    box-shadow: var(--shadow-2);
    transition: transform 0.18s ease;
  }
  .codex-side.collapsed {
    width: 280px;
    border-right: 1px solid var(--line-soft);
    transform: translateX(-100%);
  }
}
</style>
