import { handleLongvideoApi } from "./api/index.js";
import { initDatabase } from "./repository/init.js";
import { resetStuck } from "./repository/projects.js";

export default {
  name: "longvideo",
  match: (path) => path.startsWith("/apps/longvideo/"),
  initDb: initDatabase,
  initRuntime: async () => { resetStuck(); },
  handleApi: handleLongvideoApi,
};
