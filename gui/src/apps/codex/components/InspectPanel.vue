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
  flex: 1; min-height: 0; overflow: auto; padding: 26px 34px 34px; background: #f3f6f8;
}
header {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 18px;
  padding-bottom: 18px; border-bottom: 1px solid #dfe5eb;
}
h1 { margin: 0; font-size: 30px; letter-spacing: 0; color: #202124; }
p { margin: 7px 0 0; color: #6b7280; line-height: 1.6; }
header > span {
  flex: none; border-radius: 999px; background: #e8eef5; color: #596575;
  padding: 7px 12px; font-size: 13px; font-weight: 650;
}
.rows { display: grid; }
.row {
  display: grid; grid-template-columns: minmax(190px, .7fr) minmax(0, 1fr); gap: 18px;
  padding: 15px 0; border-bottom: 1px solid #dfe5eb;
}
.row-main { min-width: 0; display: grid; gap: 4px; align-content: start; }
.row-main strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #202124; font-size: 15px; }
.row-main span { color: #6b7280; font-size: 12px; line-height: 1.45; }
pre {
  min-width: 0; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: #4f5b67; font: inherit; line-height: 1.6;
}
pre.multiline {
  white-space: pre-wrap; overflow-wrap: anywhere; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px; color: #374151;
}
.state {
  margin-top: 20px; border: 1px dashed #d8dee4; border-radius: 8px; padding: 18px;
  color: #6b7280; text-align: center;
}
.state.error { border-color: #f2b8b5; background: #fde8e6; color: #b3261e; }
@media (max-width: 760px) {
  .inspect-panel { padding: 18px 16px 24px; }
  header { align-items: flex-start; flex-direction: column; }
  h1 { font-size: 25px; }
  .row { grid-template-columns: 1fr; gap: 8px; }
  pre { white-space: pre-wrap; overflow-wrap: anywhere; }
}
</style>
