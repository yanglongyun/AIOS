import { handleCoinmarketApi } from "./api/index.js";
var stdin_default = {
  name: "coinmarket",
  match: (path) => path.startsWith("/apps/coinmarket/"),
  handleApi: handleCoinmarketApi
};
export {
  stdin_default as default
};
