import { handleReaderApi } from "./api/index.js";
import { initReaderDatabase } from "./repository/init.js";
var stdin_default = {
  name: "reader",
  match: (path) => path.startsWith("/apps/reader/"),
  initDb: initReaderDatabase,
  handleApi: handleReaderApi
};
export {
  stdin_default as default
};
