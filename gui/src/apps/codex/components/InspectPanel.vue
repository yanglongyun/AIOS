<script setup>
const props = defineProps({
  panel: { type: String, default: "account" },
  data: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const panelTitles = {
  account: ["账号", "当前 Codex 登录状态和认证方式。"],
  models: ["模型", "Codex 可用模型和默认配置。"],
  config: ["配置", "当前工作区解析后的 Codex 配置。"],
  permissions: ["权限", "当前工作区可用的权限配置。"],
  skills: ["技能", "当前工作区可发现的 Codex skills。"],
  mcp: ["MCP", "MCP 服务、工具和认证状态。"],
  plugins: ["插件", "本机和市场来源的插件。"],
  hooks: ["Hooks", "当前工作区可用的 Codex hooks。"],
  apps: ["应用", "Codex app-server 可见的应用连接。"],
};

function title() {
  return panelTitles[props.panel]?.[0] || "信息";
}

function subtitle() {
  return panelTitles[props.panel]?.[1] || "";
}

function root() {
  return props.data?.result || props.data || {};
}

function list() {
  const value = root();
  if (props.panel === "account") return value.account ? [value.account] : [];
  if (props.panel === "config") return Object.entries(value.config || {}).map(([key, val]) => ({ key, value: val }));
  if (props.panel === "skills") return (value.data || []).flatMap((group) => group.skills || []);
  if (props.panel === "hooks") return (value.data || []).flatMap((group) => group.hooks || []);
  if (props.panel === "plugins") return (value.marketplaces || []).flatMap((market) => market.plugins || []);
  return value.data || [];
}

function countLabel() {
  const count = list().length;
  if (props.panel === "config") return `${count} 项`;
  if (props.panel === "account") return count ? "已读取" : "未登录";
  return `${count} 条`;
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "未设置";
  if (typeof value === "boolean") return value ? "开启" : "关闭";
  if (Array.isArray(value)) return value.length ? value.join("、") : "无";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function itemTitle(item) {
  if (props.panel === "account") {
    if (item.type === "chatgpt") return item.email || "ChatGPT";
    if (item.type === "apiKey") return "API Key";
    return item.type || "账号";
  }
  if (props.panel === "config") return item.key;
  return item.displayName || item.name || item.id || item.key || "未命名";
}

function itemMeta(item) {
  if (props.panel === "account") return item.planType || item.type || "";
  if (props.panel === "models") return [item.model, item.isDefault ? "默认" : ""].filter(Boolean).join(" · ");
  if (props.panel === "config") return "";
  if (props.panel === "mcp") return item.authStatus?.status || item.authStatus?.type || "";
  if (props.panel === "permissions") return item.description || "";
  if (props.panel === "plugins") return [item.installed ? "已安装" : "未安装", item.enabled ? "启用" : "停用"].join(" · ");
  if (props.panel === "hooks") return [item.eventName, item.enabled ? "启用" : "停用"].filter(Boolean).join(" · ");
  if (props.panel === "apps") return [item.isAccessible ? "可用" : "不可用", item.isEnabled ? "启用" : "停用"].join(" · ");
  return item.description || "";
}

function itemBody(item) {
  if (props.panel === "config") return displayValue(item.value);
  if (props.panel === "models") return item.description || "";
  if (props.panel === "skills") return item.description || item.shortDescription || item.path || "";
  if (props.panel === "mcp") return `${Object.keys(item.tools || {}).length} 个工具`;
  if (props.panel === "hooks") return item.command || item.sourcePath || "";
  if (props.panel === "apps") return item.description || "";
  return "";
}

function hasMultilineBody(item) {
  return itemBody(item).includes("\n") || itemBody(item).length > 90;
}
</script>

<template>
  <section class="inspect-panel">
    <header>
      <div>
        <h1>{{ title() }}</h1>
        <p>{{ subtitle() }}</p>
      </div>
      <span>{{ countLabel() }}</span>
    </header>

    <div v-if="loading" class="state">正在读取</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <div v-else-if="!list().length" class="state">暂无数据</div>
    <div v-else class="rows">
      <article v-for="(item, index) in list()" :key="item.id || item.name || item.key || index" class="row">
        <div class="row-main">
          <strong>{{ itemTitle(item) }}</strong>
          <span v-if="itemMeta(item)">{{ itemMeta(item) }}</span>
        </div>
        <pre v-if="itemBody(item)" :class="{ multiline: hasMultilineBody(item) }">{{ itemBody(item) }}</pre>
      </article>
    </div>
  </section>
</template>

<style scoped>
.inspect-panel {
  flex: 1; min-height: 0; overflow: auto;
  padding: 24px 32px 32px;
  background: var(--bg);
}
header {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line-soft);
}
h1 {
  margin: 0; font-size: 22px; font-weight: 650; letter-spacing: -0.01em;
  color: var(--text);
}
p { margin: 6px 0 0; color: var(--text-2); line-height: 1.6; font-size: 13px; }
header > span {
  flex: none;
  border-radius: 999px;
  background: var(--bg-elev);
  color: var(--text-2);
  padding: 5px 11px;
  font-family: var(--font-mono);
  font-size: 11.5px; font-weight: 500;
  letter-spacing: 0.02em;
}
.rows { display: grid; margin-top: 4px; }
.row {
  display: grid; grid-template-columns: minmax(190px, .7fr) minmax(0, 1fr); gap: 18px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line-soft);
}
.row-main { min-width: 0; display: grid; gap: 4px; align-content: start; }
.row-main strong {
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--text); font-size: 14px; font-weight: 600;
}
.row-main span {
  color: var(--text-3); font-size: 11.5px; line-height: 1.45;
  font-family: var(--font-mono);
}
pre {
  min-width: 0; margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: var(--text-2);
  font-family: var(--font-mono); font-size: 12.5px;
  line-height: 1.6;
}
pre.multiline {
  white-space: pre-wrap; overflow-wrap: anywhere;
  font-size: 12px;
  color: var(--text);
  background: var(--bg-elev);
  border-radius: 6px;
  padding: 10px 12px;
  box-shadow: inset 0 0 0 1px var(--line-soft);
}
.state {
  margin-top: 24px; border: 1px dashed var(--line);
  border-radius: 10px; padding: 24px;
  color: var(--text-3); text-align: center;
  font-size: 13px;
  background: var(--bg-elev);
}
.state.error {
  border-color: rgba(217, 48, 37, 0.4);
  background: rgba(217, 48, 37, 0.06);
  color: var(--bad);
  font-family: var(--font-mono);
  font-size: 12.5px;
  text-align: left;
}
@media (max-width: 760px) {
  .inspect-panel { padding: 18px 16px 24px; }
  header { align-items: flex-start; flex-direction: column; }
  h1 { font-size: 19px; }
  .row { grid-template-columns: 1fr; gap: 8px; }
  pre { white-space: pre-wrap; overflow-wrap: anywhere; }
}
</style>
