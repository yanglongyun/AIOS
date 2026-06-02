import { handleDemogenApi } from "./api/index.js";
import { initDatabase } from "./repository/init.js";

export default {
  name: "demogen",
  match: (path) => path.startsWith("/apps/demogen/"),
  initDb: initDatabase,
  handleApi: handleDemogenApi,
};
