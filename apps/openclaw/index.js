import { handleOpenclawApi } from "./api/index.js";
var stdin_default = {
  name: "openclaw",
  match: (path) => path.startsWith("/apps/openclaw/"),
  handleApi: handleOpenclawApi
};
export {
  stdin_default as default
};
