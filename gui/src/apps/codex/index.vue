<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import * as codexApi from "./api.js";
import Messages from "./components/Messages.vue";
import Composer from "./components/Composer.vue";
import Sidebar from "./components/Sidebar.vue";
import CodexTopbar from "./components/CodexTopbar.vue";
import ThreadHeader from "./components/ThreadHeader.vue";
import EnvDrawer from "./components/EnvDrawer.vue";
import { modes, envPanels } from "./constants.js";

const drawerOpen = ref(!(typeof window !== "undefined" && window.innerWidth <= 720));
const threads = ref([]);
const activeThread = ref(null);
const messages = ref([]);
const input = ref("");
const status = ref(null);
const loadingThreads = ref(false);
const starting = ref(false);
const running = ref(false);
const error = ref("");

const envOpen = ref(false);
const envPanel = ref("account");
const envData = ref({});
const envLoading = ref(false);
const envError = ref("");

const options = ref({
  mode: "workspace",
  cwd: "/Users/woodchange/Desktop/AIOS",
});

const connected = computed(() => Boolean(status.value?.connected && status.value?.initialized));
const activeMode = computed(() => modes.find((item) => item.id === options.value.mode) || modes[1]);
const activeTitle = computed(() => {
  if (!connected.value) return "Codex";
  if (!activeThread.value) return "新会话";
  return activeThread.value.title || activeThread.value.name || "会话";
});

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
  try {
    const res = await codexApi.status();
    status.value = res.status || res;
  } catch (err) {
    // ignore — status check failure means disconnected
  }
}

async function startBridge() {
  if (starting.value) return;
  error.value = "";
  starting.value = true;
  try {
    const res = await codexApi.start();
    status.value = res.status || res;
    if (connected.value) await loadThreads();
  } catch (err) {
    error.value = err?.body?.message || err.message || String(err);
  } finally {
    starting.value = false;
  }
}

async function loadThreads() {
  loadingThreads.value = true;
  error.value = "";
  try {
    const res = await codexApi.listThreads({ limit: 80 });
    threads.value = normalizeThreads(res);
  } catch (err) {
    error.value = err?.body?.message || err.message || String(err);
  } finally {
    loadingThreads.value = false;
    await refreshStatus();
  }
}

async function loadEnv(panel = envPanel.value) {
  if (!envPanels.find((p) => p.id === panel)) return;
  envLoading.value = true;
  envError.value = "";
  try {
    const res = await codexApi.inspect({ panel, cwd: options.value.cwd });
    envData.value = { ...envData.value, [panel]: res };
  } catch (err) {
    envError.value = err?.body?.message || err.message || String(err);
  } finally {
    envLoading.value = false;
  }
}

function newThread() {
  activeThread.value = null;
  messages.value = [];
  input.value = "";
  error.value = "";
  closeDrawerOnMobile();
}

async function pickThread(thread) {
  activeThread.value = thread;
  messages.value = [];
  error.value = "";
  closeDrawerOnMobile();
  try {
    const res = await codexApi.readThread(thread.id);
    messages.value = collectMessages(res.result || res);
  } catch (err) {
    error.value = err?.body?.message || err.message || String(err);
  }
}

function openEnv() {
  envOpen.value = true;
  closeDrawerOnMobile();
  loadEnv(envPanel.value);
}

function selectEnvPanel(id) {
  envPanel.value = id;
  loadEnv(id);
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
  if (!prompt || running.value || !connected.value) return;
  input.value = "";
  error.value = "";
  addMessage("user", prompt);
  running.value = true;
  try {
    const thread = await ensureThread();
    const res = await codexApi.runTurn({
      threadId: thread.id,
      prompt,
      cwd: options.value.cwd,
      sandbox: activeMode.value.sandbox,
      approvalPolicy: activeMode.value.approvalPolicy,
    });
    const finalText = String(res?.result?.finalText || "").trim();
    if (finalText) addMessage("assistant", finalText);
    await loadThreads();
  } catch (err) {
    error.value = err?.body?.message || err.message || String(err);
  } finally {
    running.value = false;
  }
}

onMounted(async () => {
  await refreshStatus();
  if (connected.value) await loadThreads();
});
</script>

<template>
  <div class="app-frame codex-app">
    <CodexTopbar
      :title="activeTitle"
      :connected="connected"
      :starting="starting"
      :drawer-open="drawerOpen"
      @toggle-drawer="toggleDrawer"
      @start="startBridge" />

    <div v-if="error" class="error">{{ error }}</div>

    <div class="app-body">
      <Transition name="mask">
        <div v-if="drawerOpen && isMobile()" class="codex-side-mask" @click="drawerOpen = false" />
      </Transition>

      <aside class="codex-side" :class="{ collapsed: !drawerOpen }">
        <div class="codex-side-inner">
          <Sidebar
            :threads="threads"
            :active-id="activeThread?.id || ''"
            :loading="loadingThreads"
            :connected="connected"
            @new="newThread"
            @pick="pickThread"
            @refresh="loadThreads"
            @env="openEnv" />
        </div>
      </aside>

      <section class="codex-content">
        <div v-if="!connected" class="disconnected">
          <div class="d-icon">
            <span class="msi">{{ starting ? 'progress_activity' : 'power_settings_new' }}</span>
          </div>
          <h1>{{ starting ? "正在启动 Codex" : "Codex 未连接" }}</h1>
          <p>{{ starting ? "稍候,正在连接本机 Codex app-server。" : "启动本机 Codex app-server 后开始会话。" }}</p>
          <button class="start-cta" :disabled="starting" @click="startBridge">
            <span class="msi" :class="{ spinning: starting }">{{ starting ? 'progress_activity' : 'play_arrow' }}</span>
            <span>{{ starting ? "启动中" : "启动 Codex" }}</span>
          </button>
        </div>

        <main v-else class="codex-main">
          <ThreadHeader
            :title="activeTitle"
            :modes="modes"
            :mode="options.mode"
            :cwd="options.cwd"
            :disabled="running"
            @update:mode="options.mode = $event"
            @update:cwd="options.cwd = $event" />
          <Messages
            :messages="messages"
            :running="running"
            :empty-title="activeThread ? '当前会话' : '新会话'"
            :empty-text="activeThread ? '从输入框继续这个会话。' : '在下方输入指令开始一个新的 Codex 线程。'" />
          <Composer v-model="input" :disabled="running" @send="sendPrompt" />
        </main>
      </section>
    </div>

    <EnvDrawer
      :open="envOpen"
      :panel="envPanel"
      :data="envData"
      :loading="envLoading"
      :error="envError"
      @close="envOpen = false"
      @select="selectEnvPanel" />
  </div>
</template>

<style scoped>
.codex-app { background: var(--bg); color: var(--text); position: relative; }
.app-body { position: relative; }
.codex-content { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.codex-main { flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.codex-side {
  flex: none;
  width: 260px;
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
  width: 260px;
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
  flex: none; margin: 10px 14px 0;
  border-radius: 8px; padding: 9px 12px;
  background: rgba(217, 48, 37, 0.08);
  color: var(--bad);
  font-family: var(--font-mono);
  font-size: 12.5px;
  box-shadow: inset 0 0 0 1px rgba(217, 48, 37, 0.2);
}

.disconnected {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 14px;
  padding: 40px 24px;
  text-align: center;
}
.d-icon {
  width: 72px; height: 72px;
  border-radius: 18px;
  display: grid; place-items: center;
  background: var(--bg-elev);
  color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--line-soft);
  margin-bottom: 6px;
}
.d-icon .msi { font-size: 38px; }
.disconnected h1 {
  margin: 0;
  font-size: 22px; font-weight: 650; letter-spacing: -0.01em;
  color: var(--text);
}
.disconnected p {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-2);
  max-width: 360px;
  line-height: 1.65;
}
.start-cta {
  margin-top: 8px;
  display: inline-flex; align-items: center; gap: 8px;
  height: 40px; padding: 0 18px;
  border: 0; border-radius: 999px;
  background: var(--accent); color: #fff;
  font: inherit; font-size: 13.5px; font-weight: 600;
  cursor: pointer;
  box-shadow: var(--shadow-1);
  transition: background .15s, box-shadow .15s;
}
.start-cta:hover:not(:disabled) { background: var(--accent-hi); box-shadow: var(--shadow-2); }
.start-cta:disabled { opacity: 0.7; cursor: default; }
.start-cta .msi { font-size: 20px; }

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

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
    width: 260px;
    border-right: 1px solid var(--line-soft);
    transform: translateX(-100%);
  }
}
</style>
