import { handleCodexApi } from "./api/index.js";

export default {
  name: "codex",
  match: (path) => path.startsWith("/apps/codex/"),
  handleApi: handleCodexApi,
};
