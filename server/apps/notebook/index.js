import { handleNotebookApi } from "./api.js";
import { initNotebookDatabase } from "./repository.js";

export default {
  name: "notebook",
  match: (path) => path.startsWith("/apps/notebook/"),
  initDb: initNotebookDatabase,
  handleApi: handleNotebookApi,
};
