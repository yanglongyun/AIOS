import { handleCoinmarketApi } from "./api/index.js";
import { initCoinmarketDatabase } from "./repository/init.js";
var stdin_default = {
  name: "coinmarket",
  match: (path) => path.startsWith("/apps/coinmarket/"),
  initDb: initCoinmarketDatabase,
  handleApi: handleCoinmarketApi
};
export { stdin_default as default };
