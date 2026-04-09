import { handleWikitreeApi } from "./api/index.js";
import { initDb } from "./repository/init.js";

export default {
  name: "wikitree",
  match: (path) => path.startsWith("/apps/wikitree/"),
  initDb: initDb,
  handleApi: handleWikitreeApi
};
