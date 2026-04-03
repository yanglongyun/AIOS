import { handleHackernewsApi } from "./api/index.js";
import { initHackernewsDatabase } from "./repository/init.js";
var stdin_default = {
  name: "hackernews",
  match: (path) => path.startsWith("/apps/hackernews/"),
  initDb: initHackernewsDatabase,
  handleApi: handleHackernewsApi
};
export {
  stdin_default as default
};
