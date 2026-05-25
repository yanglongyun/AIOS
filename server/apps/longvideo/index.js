import { handleLongvideoApi } from "./api/index.js";
import { initDatabase } from "./repository/init.js";

export default {
  name: "longvideo",
  match: (path) => path.startsWith("/apps/longvideo/"),
  initDb: initDatabase,
  handleApi: handleLongvideoApi,
};
