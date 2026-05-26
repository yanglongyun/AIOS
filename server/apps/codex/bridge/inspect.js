import { DEFAULT_CWD } from "./env.js";
import { callCodex, startCodexAppServer } from "./app-server.js";

const withServer = async (method, params = {}, timeoutMs) => {
  await startCodexAppServer();
  return callCodex(method, params, timeoutMs);
};

const readCodexAccount = () => withServer("account/read", { refreshToken: false });

const listCodexModels = () => withServer("model/list", {
  limit: 80,
  includeHidden: false,
});

const readCodexConfig = ({ cwd = DEFAULT_CWD } = {}) => withServer("config/read", {
  includeLayers: true,
  cwd,
});

const listCodexPermissions = ({ cwd = DEFAULT_CWD } = {}) => withServer("permissionProfile/list", {
  cwd,
});

const listCodexMcpServers = () => withServer("mcpServerStatus/list", {
  limit: 80,
  detail: "toolsAndAuthOnly",
});

const listCodexSkills = ({ cwd = DEFAULT_CWD } = {}) => withServer("skills/list", {
  cwds: [cwd],
  forceReload: false,
});

const listCodexHooks = ({ cwd = DEFAULT_CWD } = {}) => withServer("hooks/list", {
  cwds: [cwd],
});

const listCodexPlugins = ({ cwd = DEFAULT_CWD } = {}) => withServer("plugin/list", {
  cwds: [cwd],
});

const listCodexApps = () => withServer("app/list", {
  limit: 80,
  forceRefetch: false,
});

const inspectCodexPanel = async (panel, options = {}) => {
  if (panel === "account") return readCodexAccount();
  if (panel === "models") return listCodexModels();
  if (panel === "config") return readCodexConfig(options);
  if (panel === "permissions") return listCodexPermissions(options);
  if (panel === "mcp") return listCodexMcpServers();
  if (panel === "skills") return listCodexSkills(options);
  if (panel === "hooks") return listCodexHooks(options);
  if (panel === "plugins") return listCodexPlugins(options);
  if (panel === "apps") return listCodexApps();
  throw new Error("Unknown Codex inspect panel");
};

export {
  inspectCodexPanel,
  listCodexApps,
  listCodexHooks,
  listCodexMcpServers,
  listCodexModels,
  listCodexPermissions,
  listCodexPlugins,
  listCodexSkills,
  readCodexAccount,
  readCodexConfig,
};
