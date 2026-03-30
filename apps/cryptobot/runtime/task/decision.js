const buildAutonomousPrompt = (cfg) => {
  return [
    "\u4F60\u662F\u52A0\u5BC6\u8D27\u5E01\u81EA\u4E3B\u4EA4\u6613\u4EE3\u7406\uFF0C\u5F53\u524D\u5904\u4E8E\u5B9E\u76D8\u6A21\u5F0F\u3002",
    `\u76EE\u6807\uFF1A${cfg.goal}`,
    "",
    "\u4EA4\u6613\u6240\u8FDE\u63A5\u4FE1\u606F\uFF1A",
    `API Endpoint: ${cfg.base_url || "https://www.okx.com"}`,
    `API Key: ${cfg.api_key || ""}`,
    `API Secret: ${cfg.api_secret || ""}`,
    `Passphrase: ${cfg.passphrase || ""}`,
    "",
    "\u8981\u6C42\uFF1A",
    "1. \u5728\u672C\u8F6E\u4EFB\u52A1\u4E2D\uFF0C\u4F60\u53EF\u4EE5\u5B8C\u5168\u81EA\u4E3B\u8FDB\u884C\u5E02\u573A\u5206\u6790\u4E0E\u4EA4\u6613\u6267\u884C\u3002",
    "2. \u4E0D\u9700\u8981\u89E3\u91CA\u8FC7\u7A0B\u7ED9\u7528\u6237\uFF0C\u53EA\u9700\u8981\u7ED9\u51FA\u672C\u8F6E\u6267\u884C\u603B\u7ED3\u3002",
    "3. \u6700\u7EC8\u53EA\u8F93\u51FA\u7EAF\u6587\u672C\u603B\u7ED3\uFF08120~280\u5B57\uFF09\uFF0C\u4E0D\u8981 JSON\uFF0C\u4E0D\u8981 markdown\uFF0C\u4E0D\u8981\u4EE3\u7801\u5757\u3002",
    "4. \u603B\u7ED3\u5185\u5BB9\u5FC5\u987B\u5305\u542B\uFF1A\u672C\u8F6E\u4E3B\u8981\u5224\u65AD\u3001\u6267\u884C\u52A8\u4F5C\u3001\u7ED3\u679C\u4E0E\u4E0B\u4E00\u8F6E\u5173\u6CE8\u70B9\u3002"
  ].join("\n");
};
const requestDecisionTask = async (cfg) => {
  const prompt = buildAutonomousPrompt(cfg);
  const resp = await fetch("http://localhost:9700/api/task/create/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app: "cryptobot",
      title: "\u7092\u5E01\u673A\u81EA\u4E3B\u6267\u884C",
      prompt
    })
  });
  const data = await resp.json();
  if (!resp.ok || data.success === false) {
    throw new Error(data.message || data.error || `request failed ${resp.status}`);
  }
  const summary = String(data.response || "").trim() || "\u672C\u8F6E\u4EFB\u52A1\u5DF2\u6267\u884C\uFF0C\u4F46\u672A\u8FD4\u56DE\u6709\u6548\u603B\u7ED3\u3002";
  return {
    summary: summary.slice(0, 1200),
    task_id: Number(data.id || 0)
  };
};
export {
  requestDecisionTask
};
