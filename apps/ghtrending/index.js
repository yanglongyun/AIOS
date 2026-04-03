import { handleGhtrendingApi } from "./api/index.js";
var stdin_default = {
  name: "ghtrending",
  match: (path) => path.startsWith("/apps/ghtrending/"),
  handleApi: handleGhtrendingApi
};
export { stdin_default as default };
